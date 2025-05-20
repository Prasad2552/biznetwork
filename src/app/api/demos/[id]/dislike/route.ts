//src\app\api\demos\[id]\dislike\route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Demo from '@/lib/models/Demo';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id: demoId } = await Promise.resolve(params); // Await params
        let userId: Types.ObjectId | null = null;

        // Check for NextAuth session first
        const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (session && session.id) {
            userId = new Types.ObjectId(session.id);
        }else {
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

        const demo = await Demo.findById(demoId);
        if (!demo) {
            return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
        }

       const existingLike = demo.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
        const existingDislike = demo.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

       const updateData: any = {};
        let liked = false;
        let disliked = false;

        if (existingLike) {
            // User has liked, remove like and add dislike
            updateData.$pull = { likedBy: userId };
            updateData.$inc = { likes: -1, dislikes: 1 };
             updateData.$addToSet = { dislikedBy: userId };
             liked = false;
              disliked = true;
          } else if (existingDislike){
              // user already disliked , remove dislike
             updateData.$pull = { dislikedBy: userId };
             updateData.$inc = { dislikes: -1 };
             disliked = false;
          } else {
              //User hasn't liked or disliked. add dislike
              updateData.$addToSet = { dislikedBy: userId };
              updateData.$inc = { dislikes: 1 };
              disliked = true;
            }

        await demo.updateOne(updateData);
        const updatedDemo = await Demo.findById(demoId);

        return NextResponse.json({ likes: updatedDemo.likes, dislikes: updatedDemo.dislikes, likedBy: updatedDemo.likedBy, dislikedBy: updatedDemo.dislikedBy, liked, disliked });


    } catch (error: any) {
        console.error('Error disliking demo:', error);
         return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}