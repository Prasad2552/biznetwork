import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Channel from '@/lib/models/Channel';
import Short from '@/lib/models/Short';  // Import Short model
import { slugify } from '@/utils/slugify';
import { Types } from 'mongoose';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';

const MAX_FILE_SIZE = 80 * 1024 * 1024; // 50MB max file size
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB max file size
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']; // Added QuickTime for iOS compatibility
const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

async function uploadFileToS3(file: File, userId: string, fileType: string): Promise<string | null> {
    if (!file) return null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileType}_${userId}_${uuidv4()}.${fileExtension}`;
    const uploadParams: PutObjectCommandInput = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileName, // Corrected: Using fileName for S3 upload Key
        Body: buffer,
        ContentType: file.type,
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
        console.log("S3 upload response:", data);
        return fileUrl;
    } catch (error) {
        console.error("Failed to upload file to S3", error)
        throw new Error("Failed to upload file to S3")
    }
}

async function generateThumbnail(videoUrl: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const bufferStream = new PassThrough();
        const chunks: any = [];

        bufferStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        bufferStream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
        });

        ffmpeg(videoUrl)
            .on('end', () => console.log('Screenshots taken'))
            .on('error', (err) => {
                console.error('Error generating thumbnail:', err);
                reject(err);
            })
            .outputFormat('image2')
            .outputOptions(['-vframes 1', '-ss 00:00:01']) // Capture 1 frame at 1 second
            .pipe(bufferStream, { end: true });
    });
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const formData = await request.formData();
        const userId = uuidv4();
        const file = formData.get('video') as File | null;
        const thumbnailFile = formData.get('thumbnail') as File | null;
        const contentType = formData.get('contentType') as string | null;
        const title = formData.get('title') as string;
        const channelId = formData.get('channelId') as string;
        const description = formData.get('description') as string | null; // Handle optional description
        const duration = formData.get('duration') as string | null;
        const categories = formData.get('categories') as string | undefined; // Handle optional categories

        if (!file) {
            return NextResponse.json({ error: 'No video file uploaded' }, { status: 400 });
        }

        if (!contentType) {
            return NextResponse.json({ error: 'Content type not specified' }, { status: 400 });
        }

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        if (!channelId) {
            return NextResponse.json({ error: 'Channel Id is required' }, { status: 400 });
        }

         if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
                return NextResponse.json({ error: `Invalid video file type. Allowed types: mp4, webm, quicktime` }, { status: 400 });
            }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds the 50MB limit' }, { status: 400 });
        }

        if (file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds the 2MB limit' }, { status: 400 });
        }

    

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return NextResponse.json({ error: `Invalid file type. Allowed types: jpeg, jpg, png, webp` }, { status: 400 });
        }



        

        let thumbnailUrl = null;
        let videoUrl = null;

        try {
            const fileExtension = file.name.split('.').pop();
            const newVideoFilename = `short_${userId}_${uuidv4()}.${fileExtension}`;

            videoUrl = await uploadFileToS3(
                new File([file], newVideoFilename, { type: file.type }),
                userId,
                'short'
            );
            if (thumbnailFile) {
                thumbnailUrl = await uploadFileToS3(thumbnailFile, userId, 'short_thumb');
            } else {
                if (videoUrl) {
                    const thumbnailBuffer = await generateThumbnail(videoUrl);
                    const thumbnailFileGenerated = new File([thumbnailBuffer], 'thumbnail.jpg', { type: 'image/jpeg' });
                    thumbnailUrl = await uploadFileToS3(thumbnailFileGenerated, userId, 'short_thumb');
                }
            }
        } catch (uploadError) {
            console.error('Error uploading files:', uploadError);
            return NextResponse.json({ error: 'Failed to upload files', details: uploadError instanceof Error ? uploadError.message : 'Unknown error' }, { status: 500 });
        }

         let parsedCategories: string[] = [];
           if (categories) {
             try {
             parsedCategories = JSON.parse(categories) as string[];
            } catch(e) {
             console.error('Failed to parse categories', e);
               parsedCategories = []
              }
           }

         let shortSlug = slugify(title);
               // Check if the generated slug already exists in the database
         let slugExists = await Short.findOne({ slug: shortSlug });

                // If the slug exists, append a unique identifier to it
         if (slugExists) {
                    shortSlug = `${shortSlug}-${uuidv4().substring(0, 8)}`; // Append first 8 characters of UUID
         }
         const newShort = new Short({
                channelId: new Types.ObjectId(channelId),
                title,
                description,
                videoUrl,
                thumbnailUrl,
                status: 'published',//check 404 error.
                duration,
                comments: [],
                likedBy: [],
                dislikedBy: [],
                likes: 0,
                dislikes: 0,
                views: 0,
                slug: shortSlug
            });

        await newShort.save();

        await Channel.findByIdAndUpdate(channelId, { $inc: { videoCount: 1 } });

        return NextResponse.json({ videoId: newShort._id, title, channelId }, { status: 201 });

    } catch (error) {
        console.error('Error saving short or updating count:', error);
        return NextResponse.json({ error: 'Failed to save short or update channel count', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}