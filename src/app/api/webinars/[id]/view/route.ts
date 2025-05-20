import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Webinar, {IWebinar} from '@/lib/models/Webinar';
import connectDB from '@/lib/mongodb';

interface UpdatedWebinarResponse {
    views: number;
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const webinarId = params.id;

  if (!mongoose.Types.ObjectId.isValid(webinarId)) {
    return NextResponse.json({ error: 'Invalid webinar ID' }, { status: 400 });
  }

    try {
        await connectDB();
        const updatedWebinar = await Webinar.findByIdAndUpdate(
            new mongoose.Types.ObjectId(webinarId),
            { $inc: { views: 1 } },
            {
                new: true,
                runValidators: true
            }
        ).lean() as IWebinar | null;

        if (!updatedWebinar) {
            return NextResponse.json({ error: 'Webinar not found' }, { status: 404 });
        }
    
         const response: UpdatedWebinarResponse =  {
          views: updatedWebinar?.views ?? 0,
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating webinar view count:', error);
       return NextResponse.json({
          error: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error'
         }, { status: 500 });
    }
}