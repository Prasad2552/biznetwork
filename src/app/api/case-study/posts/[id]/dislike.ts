import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CaseStudy from '@/lib/models/CaseStudy';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { getToken } from 'next-auth/jwt';

interface DecodedToken {
    userId: string;
    [key: string]: any; // Allows for other properties in the token
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id: caseStudyId } = params;
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.substring(7);

        let userId: Types.ObjectId | null = null;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized, missing token' }, { status: 401 });
        }

        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
            userId = new Types.ObjectId(decodedToken.userId);
        } catch (error) { //Renamed jwtError to error because it was unused
            const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
            if (session && session.id) {
                userId = new Types.ObjectId(session.id);
            } else {
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
        }

        const caseStudy = await CaseStudy.findById(caseStudyId);
        if (!caseStudy) {
            return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
        }

        const existingLike = caseStudy.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
        const existingDislike = caseStudy.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

        let updateData: any = {};
        let liked = false;
        let disliked = false;

        if (existingLike) {
            // Remove from likes and add to dislikes
            updateData = {
                $pull: { likedBy: userId },
                $addToSet: { dislikedBy: userId },
                $inc: { likes: -1, dislikes: 1 }
            };
            liked = false;
            disliked = true;
        }
        else if (existingDislike) {
            updateData = {
                $pull: { dislikedBy: userId },
                $inc: { dislikes: -1 }
            };
            disliked = false;
        }
        else {
            updateData = {
                $addToSet: { dislikedBy: userId }, // In "like/route.ts" this should be $addToSet: { likedBy: userId },
                $inc: { dislikes: 1 } // In "like/route.ts" this should be  $inc: { likes: 1 }
            };
            disliked = true;
        }

        await caseStudy.updateOne(updateData);
        const updatedCaseStudy = await CaseStudy.findById(caseStudyId);


        return NextResponse.json({
            likes: updatedCaseStudy?.likes ?? 0, // Added nullish coalescing operator
            dislikes: updatedCaseStudy?.dislikes ?? 0, // Added nullish coalescing operator
            likedBy: updatedCaseStudy?.likedBy ?? [], // Added nullish coalescing operator
            dislikedBy: updatedCaseStudy?.dislikedBy ?? [], // Added nullish coalescing operator
            liked,
            disliked
        });

    } catch (error: any) {
        console.error('Error disliking case study:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}