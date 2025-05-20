//src\app\api\publish-form\route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PublishForm from '@/lib/models/PublishForm';
import { S3Client, PutObjectCommand, type PutObjectCommandInput } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

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

    const uploadParams: PutObjectCommandInput = { // Correct type here
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
    console.log('Received form submission request');
    try {
        await connectDB();
        console.log('Connected to database');

        const formData = await req.formData();
        console.log('Parsed form data');
        
        const userId = uuidv4()
        // Upload files to S3
        const companyLogo = formData.get('companyLogo') as File;
        const companyBanner = formData.get('companyBanner') as File;
        
        const [logoUrl, bannerUrl] = await Promise.all([
            uploadFileToS3(companyLogo, userId, 'companyLogo'),
            uploadFileToS3(companyBanner, userId, 'companyBanner'),
        ]);

        // Convert FormData to a plain object
        const formDataObject: { [key: string]: any } = {};
        for (const [key, value] of formData.entries()) {
            if (formDataObject[key]) {
                if (!Array.isArray(formDataObject[key])) {
                    formDataObject[key] = [formDataObject[key]];
                }
                formDataObject[key].push(value);
            } else {
                formDataObject[key] = value;
            }
        }
        
        formDataObject.companyLogo = logoUrl
        formDataObject.companyBanner = bannerUrl

        console.log('Form data object:', formDataObject);

         // Create a new PublishForm document
        const newPublishForm = new PublishForm(formDataObject);

        await newPublishForm.save();
        console.log('Saved form data to database');

        return NextResponse.json({ message: 'Form submitted successfully', formId: newPublishForm._id }, { status: 200 });
    } catch (error: unknown) {
        console.error('Error submitting publish form:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}