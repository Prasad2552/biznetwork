// src/app/api/shorts/[id]/dislike/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Short from '@/lib/models/Short'; // Import the Short model
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id: shortId } = await Promise.resolve(params);
        let userId: Types.ObjectId | null = null;

        const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (session && session.id) {
            userId = new Types.ObjectId(session.id);
        } else {
            const authHeader = req.headers.get('authorization');
            const token = authHeader?.substring(7);

            if (!token) {
                return NextResponse.json({ error: 'Unauthorized, missing token' }, { status: 401 });
            }

            try {
                const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as any;
                userId = new Types.ObjectId(decodedToken.userId);
            } catch (jwtError) {
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
        }


        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: User ID not found' }, { status: 401 });
        }


        const short = await Short.findById(shortId); // Find the Short
        if (!short) {
            return NextResponse.json({ error: 'Short not found' }, { status: 404 });
        }

        const existingLike = short.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
        const existingDislike = short.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

        const updateData: any = {};
        let liked = false;
        let disliked = false;

        if (existingLike) {
            updateData.$pull = { likedBy: userId };    // Remove from likedBy
            updateData.$addToSet = { dislikedBy: userId }; // Add to dislikedBy in the SAME update
            updateData.$inc = { likes: -1, dislikes: 1 }; // Decrement likes, increment dislikes

            liked = false; // set liked to false
            disliked = true;
        } else if (existingDislike) {
            // User has disliked, remove dislike
            updateData.$pull = { dislikedBy: userId };
            updateData.$inc = { dislikes: -1 };
            disliked = false;
        } else {
            // User hasn't liked or disliked, add dislike
            updateData.$addToSet = { dislikedBy: userId };
            updateData.$inc = { dislikes: 1 };
            disliked = true;
        }


        await short.updateOne(updateData);
        const updatedShort = await Short.findById(shortId);

        return NextResponse.json({
            likes: updatedShort.likes,
            dislikes: updatedShort.dislikes,
            likedBy: updatedShort.likedBy,
            dislikedBy: updatedShort.dislikedBy,
            liked,
            disliked,
        });

    } catch (error: any) {
        console.error('Error disliking short:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}