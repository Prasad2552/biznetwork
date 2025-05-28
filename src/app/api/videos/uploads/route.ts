import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Channel from '@/lib/models/Channel';
import { slugify } from '@/utils/slugify';
import { Types } from 'mongoose';
import Video from '@/lib/models/Video';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommandInput } from "@aws-sdk/client-s3"; // Ensure this import is present

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB max file size
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
];

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

async function generatePresignedUrl(key: string, contentType: string, fileType: string): Promise<string | null> {
    const ContentType = fileType === 'video' ? (contentType === 'podcasts' ? 'audio/mpeg' : 'video/mp4') : (contentType === 'podcasts' ? 'image/jpeg' : 'image/jpeg');
    const params: PutObjectCommandInput = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        ContentType: ContentType, // Corrected: Use the local variable
    };

    try {
        const command = new PutObjectCommand(params);
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour (3600 seconds)
        console.log(`Generated pre-signed URL for ${fileType}:`, url); // Log the URL

        return url;
    } catch (error) {
        console.error(`Failed to generate pre-signed URL for ${fileType}:`, error);
        return null;
    }
}


export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const userId = uuidv4();
        const formData = await request.formData();
        const contentType = formData.get('contentType') as string | null;
        const title = formData.get('title') as string;
        const channelId = formData.get('channelId') as string;
        const description = formData.get('description') as string | null;
        const duration = formData.get('duration') as string | null;
        const categories = formData.get('categories') as string | undefined;

        if (!contentType) {
            return NextResponse.json({ error: 'Content type not specified' }, { status: 400 });
        }

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }
        if (!channelId) {
            return NextResponse.json({ error: 'Channel Id is required' }, { status: 400 });
        }


        // Generate pre-signed URLs
        const fileKey = `${contentType === 'podcasts' ? 'podcasts' : 'videos'}/${userId}_${uuidv4()}`;
        const filePresignedUrl = await generatePresignedUrl(fileKey, contentType, 'video');

        const thumbnailKey = `${contentType === 'podcasts' ? 'podcast_thumb' : 'video_thumb'}/${userId}_${uuidv4()}`;
        const thumbnailPresignedUrl = await generatePresignedUrl(thumbnailKey, contentType, 'thumbnail');


        let parsedCategories: string[] = []; // Corrected type declaration
        if (categories) {
            try {
                parsedCategories = JSON.parse(categories) as string[];
            } catch (e) {
                console.error('Failed to parse categories', e);
                parsedCategories = [];
            }
        }

        const newVideo = new Video({
            channelId: new Types.ObjectId(channelId),
            title,
            description,
            videoUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
            thumbnailUrl: thumbnailPresignedUrl ? `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}` : null,
            status: 'processing',
            duration,
            categories: parsedCategories,
            type: contentType === 'podcasts' ? 'podcast' : contentType === 'webinars' ? 'webinar' : contentType === 'testimonials' ? 'testimonial' : contentType === 'demos' ? 'demo' : 'video',
            slug: slugify(title)
        });
        await newVideo.save();
        await Channel.findByIdAndUpdate(channelId, { $inc: { videoCount: 1 } });

        return NextResponse.json({ videoId: newVideo._id, title, channelId, filePresignedUrl, thumbnailPresignedUrl }, { status: 201 });

    } catch (error) {
        console.error('Error creating presigned URL or saving video:', error);
        return NextResponse.json({ error: 'Failed to create pre-signed URL or save video', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
