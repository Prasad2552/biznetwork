import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Testimonial from '@/lib/models/Testimonial';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
      await connectDB();
      const { id: testimonialId } = await Promise.resolve(params) // Await params

     let userId: Types.ObjectId | null = null;
        // Check for NextAuth session first
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (session && session.id) {
      userId = new Types.ObjectId(session.id);
    }else{
        // If no session, then try jwt authentication
            const authHeader = req.headers.get('authorization');
           const token = authHeader?.substring(7);
            if (!token) {
                return NextResponse.json({ error: 'Unauthorized, missing token' }, { status: 401 });
            }

             try {
                const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as any;
                userId = new Types.ObjectId(decodedToken.userId);
            }
            catch (jwtError) {
               return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
             }
    }

     if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: User ID not found' }, { status: 401 });
    }

    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

     const existingLike = testimonial.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
    const existingDislike = testimonial.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

    const updateData: any = {};
    let liked = false;
    let disliked = false;

      if (existingLike) {
          // If the user has already liked, remove the like and decrement
          updateData.$pull = { likedBy: userId };
          updateData.$inc = { likes: -1 };
          liked = false;
      } else {
          // If user hasn't liked, add a like and increment likes
          updateData.$addToSet = { likedBy: userId };
          updateData.$inc = { likes: 1 };
           liked = true;

            //If user already disliked remove dislike
           if(existingDislike) {
              updateData.$pull = { dislikedBy: userId };
            updateData.$inc = { dislikes: -1 };
              disliked = false;
          }
      }


    await testimonial.updateOne(updateData);
    const updatedTestimonial = await Testimonial.findById(testimonialId);
    return NextResponse.json({ likes: updatedTestimonial.likes, dislikes: updatedTestimonial.dislikes, likedBy: updatedTestimonial.likedBy, dislikedBy: updatedTestimonial.dislikedBy, liked, disliked });

  } catch (error: any) {
    console.error('Error liking testimonial:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}