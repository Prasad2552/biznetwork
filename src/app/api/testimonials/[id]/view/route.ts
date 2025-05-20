import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Testimonial, {ITestimonial} from '@/lib/models/Testimonial';
import connectDB from '@/lib/mongodb';

interface UpdatedTestimonialResponse {
    views: number;
}


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const testimonialId = params.id;

  if (!mongoose.Types.ObjectId.isValid(testimonialId)) {
    return NextResponse.json({ error: 'Invalid Testimonial ID' }, { status: 400 });
  }

    try {
        await connectDB();
        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            new mongoose.Types.ObjectId(testimonialId),
            { $inc: { views: 1 } },
            {
                new: true,
                runValidators: true
            }
        ).lean() as ITestimonial | null;

        if (!updatedTestimonial) {
            return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
        }
    
         const response: UpdatedTestimonialResponse =  {
          views: updatedTestimonial?.views ?? 0,
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating Testimonial view count:', error);
       return NextResponse.json({
          error: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error'
         }, { status: 500 });
    }
}