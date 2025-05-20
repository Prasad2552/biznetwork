import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Podcast, {IPodcast} from '@/lib/models/Podcast';
import connectDB from '@/lib/mongodb';

interface UpdatedPodcastResponse {
    views: number;
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const podcastId = params.id;

  if (!mongoose.Types.ObjectId.isValid(podcastId)) {
    return NextResponse.json({ error: 'Invalid podcast ID' }, { status: 400 });
  }

    try {
        await connectDB();
        const updatedPodcast = await Podcast.findByIdAndUpdate(
            new mongoose.Types.ObjectId(podcastId),
            { $inc: { views: 1 } },
            {
                new: true,
                runValidators: true
            }
        ).lean() as IPodcast | null;

        if (!updatedPodcast) {
            return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
        }
    
         const response: UpdatedPodcastResponse =  {
          views: updatedPodcast?.views ?? 0,
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating podcast view count:', error);
       return NextResponse.json({
          error: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error'
         }, { status: 500 });
    }
}