// src/app/api/admin/channels/[channelId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Channel, { IChannel } from '@/lib/models/Channel';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
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

// Define a type for the response data
type ChannelResponse = Omit<
  IChannel,
  keyof mongoose.Document | 'createdAt' | 'updatedAt'
> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
   contentCounts: {
        videos: number;
        blogs: number;
        webinars: number;
        podcasts: number;
        caseStudies: number;
        infographics: number;
        whitePapers: number;
        testimonials: number;
        ebooks: number;
        demos: number;
        events: number;
        techNews: number; //THIS LINE
    };
    banner: string; //THIS LINE
    techNewsCount:number; //THIS LINE

};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params; // Await the Promise
    const { channelId } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID format' }, { status: 400 });
    }

    const channel = await Channel.findById(channelId);

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const contentCounts = {
      videos: channel.videoCount || 0,
      blogs: channel.blogCount || 0,
      webinars: channel.webinarCount || 0,
      podcasts: channel.podcastCount || 0,
      caseStudies: channel.caseStudyCount || 0,
      infographics: channel.infographicCount || 0,
      whitePapers: channel.whitePaperCount || 0,
      testimonials: channel.testimonialCount || 0,
      ebooks: channel.ebookCount || 0,
      demos: channel.demoCount || 0,
      events: channel.eventCount || 0,
      techNews: channel.techNewsCount || 0,
    };

    const response: ChannelResponse = {
      _id: channel._id.toString(),
      name: channel.name,
      description: channel.description,
      subscribers: channel.subscribers,
      engagements: channel.engagements,
      logo: channel.logo,
      banner: channel.banner,
      videoCount: channel.videoCount,
      blogCount: channel.blogCount,
      webinarCount: channel.webinarCount,
      podcastCount: channel.podcastCount,
      caseStudyCount: channel.caseStudyCount,
      infographicCount: channel.infographicCount,
      whitePaperCount: channel.whitePaperCount,
      testimonialCount: channel.testimonialCount,
      ebookCount: channel.ebookCount,
      demoCount: channel.demoCount,
      eventCount: channel.eventCount,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
      contentCounts: contentCounts,
      techNewsCount: channel.techNewsCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching channel data:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params; // Await the Promise
    const { channelId } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID format' }, { status: 400 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const logoFile = formData.get('logo') as File | null;
    const bannerFile = formData.get('banner') as File | null;
    const userId = uuidv4();

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
    const logoUrl = logoFile ? await uploadFileToS3(logoFile, userId, 'channel_logo') : undefined;
    const bannerUrl = bannerFile ? await uploadFileToS3(bannerFile, userId, 'channel_banner') : undefined;

    const updateData: Partial<IChannel> = {
      name,
      description,
      logo: logoUrl || undefined,
      banner: bannerUrl || undefined,
    };

    const updatedChannel = await Channel.findByIdAndUpdate(channelId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedChannel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const contentCounts = {
      videos: updatedChannel.videoCount || 0,
      blogs: updatedChannel.blogCount || 0,
      webinars: updatedChannel.webinarCount || 0,
      podcasts: updatedChannel.podcastCount || 0,
      caseStudies: updatedChannel.caseStudyCount || 0,
      infographics: updatedChannel.infographicCount || 0,
      whitePapers: updatedChannel.whitePaperCount || 0,
      testimonials: updatedChannel.testimonialCount || 0,
      ebooks: updatedChannel.ebookCount || 0,
      demos: updatedChannel.demoCount || 0,
      events: updatedChannel.eventCount || 0,
      techNews: updatedChannel.techNewsCount || 0,
    };

    const response: ChannelResponse = {
      _id: updatedChannel._id.toString(),
      name: updatedChannel.name,
      description: updatedChannel.description,
      subscribers: updatedChannel.subscribers,
      engagements: updatedChannel.engagements,
      logo: updatedChannel.logo,
      banner: updatedChannel.banner,
      videoCount: updatedChannel.videoCount,
      blogCount: updatedChannel.blogCount,
      webinarCount: updatedChannel.webinarCount,
      podcastCount: updatedChannel.podcastCount,
      caseStudyCount: updatedChannel.caseStudyCount,
      infographicCount: updatedChannel.infographicCount,
      whitePaperCount: updatedChannel.whitePaperCount,
      testimonialCount: updatedChannel.testimonialCount,
      ebookCount: updatedChannel.ebookCount,
      demoCount: updatedChannel.demoCount,
      eventCount: updatedChannel.eventCount,
      createdAt: updatedChannel.createdAt.toISOString(),
      updatedAt: updatedChannel.updatedAt.toISOString(),
      contentCounts: contentCounts,
      techNewsCount: updatedChannel.techNewsCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating channel:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params; // Await the Promise
    const { channelId } = resolvedParams;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID format' }, { status: 400 });
    }

    const deletedChannel = await Channel.findByIdAndDelete(channelId);

    if (!deletedChannel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}