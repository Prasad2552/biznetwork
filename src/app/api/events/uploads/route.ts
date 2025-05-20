import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Channel from '@/lib/models/Channel';
import { slugify } from '@/utils/slugify';
import { Types } from 'mongoose';
import Video from '@/lib/models/Video';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

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

async function uploadFileToS3(file: File, userId: string, fileType: string): Promise<string | null> {
    if (!file) return null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileType}_${userId}_${uuidv4()}.${fileExtension}`;

    const uploadParams: PutObjectCommandInput = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
    } catch (error) {
        console.error("Failed to upload file to S3", error)
        throw new Error("Failed to upload file to S3")
    }
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
          const description = formData.get('description') as string | null; //Handle optional description
        const duration = formData.get('duration') as string | null;
        const categories = formData.get('categories') as string | undefined; //Handle optional categories
          const eventImages = formData.getAll('eventImages') as File[]; // Get all event images

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

        if(!ALLOWED_FILE_TYPES.includes(file.type)){
            return NextResponse.json({ error: `Invalid file type` }, { status: 400 });
        }

        if(file.size > MAX_FILE_SIZE){
           return NextResponse.json({ error: 'File size exceeds the 10MB limit' }, { status: 400 });
        }

        if (thumbnailFile) {
            if (!ALLOWED_IMAGE_TYPES.includes(thumbnailFile.type)) {
                return NextResponse.json({ error: 'Invalid image file type' }, { status: 400 });
            }

            if (thumbnailFile.size > MAX_IMAGE_SIZE) {
                return NextResponse.json({ error: 'Image file size exceeds the 2MB limit' }, { status: 400 });
            }
        }

        // Handle Event Images
        const eventImageUrls: string[] = [];
        for (const image of eventImages) {
            if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
                return NextResponse.json({ error: 'Invalid event image file type' }, { status: 400 });
            }
            if (image.size > MAX_IMAGE_SIZE) {
                return NextResponse.json({ error: 'Event image file size exceeds the 2MB limit' }, { status: 400 });
            }
            try {
                const imageUrl = await uploadFileToS3(image, userId, 'event_image');
                if (imageUrl) {
                    eventImageUrls.push(imageUrl);
                }
            } catch (uploadError) {
                console.error('Error uploading event image:', uploadError);
                return NextResponse.json({ error: 'Failed to upload one or more event images', details: uploadError instanceof Error ? uploadError.message : 'Unknown error' }, { status: 500 });
            }
        }
         // Upload files to S3
         const [fileUrl, thumbnailUrl] = await Promise.all([
          uploadFileToS3(file, userId, 'event'),
            thumbnailFile ? uploadFileToS3(thumbnailFile, userId, 'event_thumb') : Promise.resolve(null),
        ]);

          let parsedCategories: string[] = [];
           if (categories) {
             try {
             parsedCategories = JSON.parse(categories) as string[];
            } catch(e) {
             console.error('Failed to parse categories', e);
               parsedCategories = []
              }
           }

         const newEvent = new Video({
          channelId: new Types.ObjectId(channelId),
            title,
            description,
             videoUrl: fileUrl,
            thumbnailUrl: thumbnailUrl,
            status: 'draft',
              duration,
              categories: parsedCategories, // Now, correctly parsing
              eventImageUrls: eventImageUrls, // save event image urls
           type: 'event',
             slug: slugify(title) // Added slug here
          });
          await newEvent.save();

        await Channel.findByIdAndUpdate(channelId, { $inc: { videoCount: 1 } });
           return NextResponse.json({ videoId: newEvent._id, title, channelId }, { status: 201 });
    } catch (error) {
        console.error('Error saving files or updating count:', error);
         return NextResponse.json({ error: 'Failed to save files or update channel count', details: error instanceof Error ? error.message : 'Unknown error'}, { status: 500 });
    }
}