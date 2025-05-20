//src\app\api\shorts\[id]\view\route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Short, {IShort} from '@/lib/models/Short';
import connectDB from '@/lib/mongodb';

interface UpdatedVideoResponse {
  views: number;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Await params here
  const { id: shortId } = await params;

  if (!mongoose.Types.ObjectId.isValid(shortId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  try {
    await connectDB();
    const updatedShort = await Short.findByIdAndUpdate(
      new mongoose.Types.ObjectId(shortId),
      { $inc: { views: 1 } },
      {
        new: true,
         //runValidators: true // removed validator
      }
    ).lean() as IShort | null; // Use IVideo here

    if (!updatedShort) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    const response: UpdatedVideoResponse = {
      views: updatedShort?.views ?? 0,
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating video view count:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}