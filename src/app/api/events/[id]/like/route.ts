import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/lib/models/Event';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { getToken } from 'next-auth/jwt';

interface JWTDecodedToken {
    userId: string;
    [key: string]: any; // Allows for other properties in the token
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id: eventId } = await Promise.resolve(params) // Await params

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
                const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as JWTDecodedToken;
                userId = new Types.ObjectId(decodedToken.userId);
            }
            catch (error) { // Renamed jwtError to error, it was unused
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: User ID not found' }, { status: 401 });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const existingLike = event.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
        const existingDislike = event.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

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


        await event.updateOne(updateData);
        const updatedEvent = await Event.findById(eventId);
        return NextResponse.json({
            likes: updatedEvent?.likes ?? 0,  // Added nullish coalescing operator
            dislikes: updatedEvent?.dislikes ?? 0, // Added nullish coalescing operator
            likedBy: updatedEvent?.likedBy ?? [], // Added nullish coalescing operator
            dislikedBy: updatedEvent?.dislikedBy ?? [], // Added nullish coalescing operator
            liked, disliked });

    } catch (error: any) {
        console.error('Error liking event:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}