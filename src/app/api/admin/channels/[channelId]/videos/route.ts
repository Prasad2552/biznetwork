// src/app/api/admin/channels/[channelId]/videos/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Channel from '@/lib/models/Channel';
import Video from '@/lib/models/Video';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    await dbConnect();

    const { channelId } = await params; // Await the Promise to get the params object

    // Validate channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID format' }, { status: 400 });
    }

    const { title, description, url, thumbnail } = await request.json();

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const newVideo = new Video({
      title,
      description,
      url,
      thumbnail,
      channel: channelId,
    });

    await newVideo.save();

    // Update video count for the channel
    channel.videoCount = (channel.videoCount || 0) + 1;
    await channel.save();

    return NextResponse.json(newVideo, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    await dbConnect();

    const { channelId } = await params; // Await the Promise to get the params object

    // Validate channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json({ error: 'Invalid channel ID format' }, { status: 400 });
    }

    const videos = await Video.find({ channel: channelId });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}