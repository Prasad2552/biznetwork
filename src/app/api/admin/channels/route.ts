import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/mongodb';
import Channel from '@/lib/models/Channel'; // Updated import
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


export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const userId = uuidv4();
        const formData = await request.formData();

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const logoFile = formData.get('logo') as File | null;
        const bannerFile = formData.get('banner') as File | null;

        if (!name) {
            return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
        }

        if (!description) {
            return NextResponse.json({ error: 'Channel description is required' }, { status: 400 });
        }

        // Validate image types and sizes
        if (logoFile && !ALLOWED_IMAGE_TYPES.includes(logoFile.type)) {
            return NextResponse.json({ error: 'Invalid logo file type' }, { status: 400 });
        }
        if (logoFile && logoFile.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: 'Logo file size exceeds the 2MB limit' }, { status: 400 });
        }

        if (bannerFile && !ALLOWED_IMAGE_TYPES.includes(bannerFile.type)) {
            return NextResponse.json({ error: 'Invalid banner file type' }, { status: 400 });
        }
        if (bannerFile && bannerFile.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ error: 'Banner file size exceeds the 2MB limit' }, { status: 400 });
        }

        // Upload files to S3
        const [logoUrl, bannerUrl] = await Promise.all([
            logoFile ? uploadFileToS3(logoFile, userId, 'channel_logo') : Promise.resolve(null),
            bannerFile ? uploadFileToS3(bannerFile, userId, 'channel_banner') : Promise.resolve(null)
        ]);

        const newChannel = new Channel({
            name,
            description,
            logo: logoUrl,
            banner: bannerUrl,
            subscribers: 0,
            videoCount: 0,
            blogCount: 0,
            webinarCount: 0,
            podcastCount: 0,
            caseStudyCount: 0,
            infographicCount: 0,
            whitePaperCount: 0,
            testimonialCount: 0,
            ebookCount: 0,
            demoCount: 0,
            eventCount: 0,
            techNewsCount: 0, // ADD THIS LINE

        });

        await newChannel.save();

        return NextResponse.json(newChannel, { status: 201 });
    } catch (error) {
        console.error('Error creating channel:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const channels = await Channel.find({}).select('name _id techNewsCount')  //Include techNewsCount

        return NextResponse.json(channels)
    } catch (error) {
        console.error('Error fetching channels:', error)
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
    }
}