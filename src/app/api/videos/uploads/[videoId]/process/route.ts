import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VideoModel from '@/lib/models/Video';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
  context: any // Temporary workaround to bypass type error
): Promise<NextResponse> {
  try {
    await connectDB();

    const videoId = (context as { params: { videoId: string } }).params.videoId;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is missing' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required in the request body' }, { status: 400 });
    }

    if (!['draft', 'published', 'processing', 'failed', 'processed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const video = await VideoModel.findByIdAndUpdate(
      videoId,
      { status: status },
      { new: true, runValidators: true }
    );

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Video status updated successfully', video }, { status: 200 });
  } catch (error) {
    console.error('Error updating video status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update video status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
