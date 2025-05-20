// src/app/api/tech-news-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import TechNews from '@/lib/models/TechNews';
import Channel from '@/lib/models/Channel';
import slugify from 'slugify';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB max image file size
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

async function generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title, { lower: true });
    let slug = baseSlug;
    let counter = 1;

    while (await TechNews.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const formData = await req.formData();

        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const channelId = formData.get('channelId') as string;
        const featuredImageFile = formData.get('featuredImage') as File | null; // Changed variable name
        const orientation = formData.get('orientation') as 'horizontal' | 'vertical' | '';  // Add this line

        if (!title || !content || !channelId) {
            return NextResponse.json({ message: 'Title, content, and channelId are required' }, { status: 400 });
        }

          // Validate image types and sizes
        if (featuredImageFile && !ALLOWED_IMAGE_TYPES.includes(featuredImageFile.type)) {
             return NextResponse.json({ error: 'Invalid image file type' }, { status: 400 });
        }
         if (featuredImageFile && featuredImageFile.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: 'Featured Image file size exceeds the 2MB limit' }, { status: 400 });
        }

         const userId = uuidv4()
           // Upload files to S3
         const featuredImageUrl = await uploadFileToS3(featuredImageFile as File, userId, 'technews_featured'); // Upload to S3; Type assertion

        const slug = await generateUniqueSlug(title);

        const newTechNews = new TechNews({
            title,
            content,
            channelId,
            featuredImage: featuredImageUrl, //S3 image URL
            createdAt: new Date(),
            updatedAt: new Date(),
            slug,
            orientation: orientation || null   // Save orientation to the database, or null if not selected
        });

        const savedTechNews = await newTechNews.save();

        if (!savedTechNews) {
            throw new Error("Failed to save Tech News");
        }

        await Channel.findByIdAndUpdate(channelId, { $inc: { techNewsCount: 1 } });

        return NextResponse.json({ techNewsId: savedTechNews._id }, { status: 201 });
    } catch (error) {
        console.error('Error uploading Tech News:', error);
        return NextResponse.json({ message: 'Failed to upload Tech News', error: error instanceof Error ? error.message : "Unknown Error" }, { status: 500 });
    }
}