// src/app/api/admin/channels/[channelId]/videos/[videoId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/lib/models/Video';
import { Types } from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> }
) {
  try {
    await connectDB();

    const { videoId } = await params; // Await the Promise to get the params object

    if (!videoId || !Types.ObjectId.isValid(videoId)) {
      return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
    }

    const video = await Video.findById(videoId).lean();

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    console.log('Fetched video:', video);
    return NextResponse.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}