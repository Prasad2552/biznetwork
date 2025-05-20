import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Video from '@/lib/models/Video';
import type { Video as VideoType } from '@/types/common';
import connectDB from '@/lib/mongodb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: videoId } = params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  try {
    await connectDB();
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    ).lean() as VideoType | null; // ✅ Use VideoType instead of IVideo

    if (!updatedVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ views: updatedVideo.views });
  } catch (error) {
    console.error('Error updating video view count:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
