import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Demo, {IDemo} from '@/lib/models/Demo';
import connectDB from '@/lib/mongodb';

interface UpdatedDemoResponse {
    views: number;
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const demoId = params.id;

  if (!mongoose.Types.ObjectId.isValid(demoId)) {
    return NextResponse.json({ error: 'Invalid demo ID' }, { status: 400 });
  }

    try {
        await connectDB();
        const updatedDemo = await Demo.findByIdAndUpdate(
            new mongoose.Types.ObjectId(demoId),
            { $inc: { views: 1 } },
            {
                new: true,
                runValidators: true
            }
        ).lean() as IDemo | null;

        if (!updatedDemo) {
            return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
        }
    
         const response: UpdatedDemoResponse =  {
          views: updatedDemo?.views ?? 0,
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating demo view count:', error);
       return NextResponse.json({
          error: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error'
         }, { status: 500 });
    }
}