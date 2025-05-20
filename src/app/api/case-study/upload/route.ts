// src\app\api\case-study\upload\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import CaseStudy from '@/lib/models/CaseStudy';
import Channel from '@/lib/models/Channel';
import { slugify } from '@/utils/slugify';
import { Types } from 'mongoose';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB max file size
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

export async function POST(req: NextRequest) {
  try {
    await connectDB();
        const userId = uuidv4();
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const channelId = formData.get('channelId') as string;
     const featuredImageFile = formData.get('featuredImage') as File | null;

    if (!title || !content || !channelId) {
      return NextResponse.json({ message: 'Title, content, and channelId are required' }, { status: 400 });
    }

     let featuredImageUrl = null;
    if (featuredImageFile) {
          if (!ALLOWED_IMAGE_TYPES.includes(featuredImageFile.type)) {
              return NextResponse.json({ error: 'Invalid image file type' }, { status: 400 });
          }

          if (featuredImageFile.size > MAX_IMAGE_SIZE) {
              return NextResponse.json({ error: 'Image file size exceeds the 2MB limit' }, { status: 400 });
          }

          featuredImageUrl = await uploadFileToS3(featuredImageFile, userId, 'case_study')
       }


   const contentFileName = `${slugify(title)}-${Date.now()}-content.txt`;
   const buffer = Buffer.from(content)
   const textFileUrl = await uploadFileToS3(new File([buffer], contentFileName, { type: 'text/plain' }), userId, 'case_study_content')

    // Create new case study with file URLs
    const newCaseStudy = new CaseStudy({
      title,
      content: textFileUrl,
      channelId: new Types.ObjectId(channelId),
      featuredImage: featuredImageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      slug: slugify(title),
      status: 'draft',
        filePath: textFileUrl,  // Corrected: store the S3 url here to resolve validation issue
    });


    const savedCaseStudy = await newCaseStudy.save();

    if (!savedCaseStudy) {
      throw new Error("Failed to save case study");
    }

    // Update channel case study count
    await Channel.findByIdAndUpdate(channelId, { $inc: { caseStudyCount: 1 } });

      return NextResponse.json({
        success: true,
        message: 'Case study saved successfully',
        caseStudyId: savedCaseStudy._id,
        featuredImage: featuredImageUrl,
       filePath: textFileUrl
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading case study:', error);
    return NextResponse.json({
         message: 'Failed to upload case study',
        error: error instanceof Error ? error.message : "Unknown Error"
     }, { status: 500 });
  }
}