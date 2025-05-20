import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Event, {IEvent} from '@/lib/models/Event';
import connectDB from '@/lib/mongodb';

interface UpdatedEventResponse {
    views: number;
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const eventId = params.id;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
  }

    try {
        await connectDB();
        const updatedEvent = await Event.findByIdAndUpdate(
            new mongoose.Types.ObjectId(eventId),
            { $inc: { views: 1 } },
            {
                new: true,
                runValidators: true
            }
        ).lean() as IEvent | null;

        if (!updatedEvent) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }
    
         const response: UpdatedEventResponse =  {
          views: updatedEvent?.views ?? 0,
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating event view count:', error);
       return NextResponse.json({
          error: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error'
         }, { status: 500 });
    }
}