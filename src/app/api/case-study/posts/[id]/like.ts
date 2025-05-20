// src/app/api/case-study/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CaseStudy from '@/lib/models/CaseStudy';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { getToken } from 'next-auth/jwt';

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
           const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as any;
           userId = new Types.ObjectId(decodedToken.userId);
        } catch (jwtError) {
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

        if (existingDislike) {
            // Remove from dislikes and add to likes
            updateData = {
                $pull: { dislikedBy: userId },
                $addToSet: { likedBy: userId },
                $inc: { likes: 1 }
            };
            liked = true;
             disliked = false;
        }
        else if (existingLike) {
              updateData = {
                  $pull: { likedBy: userId },
                  $inc: { likes: -1 }
              };
              liked = false;
        } else {
             updateData = {
                $addToSet: { likedBy: userId },
                $inc: { likes: 1 }
            }
              liked = true;
        }


        await caseStudy.updateOne(updateData);
          const updatedCaseStudy = await CaseStudy.findById(caseStudyId);


       return NextResponse.json({
            likes: updatedCaseStudy.likes,
             dislikes: updatedCaseStudy.dislikes,
            likedBy: updatedCaseStudy.likedBy,
            dislikedBy: updatedCaseStudy.dislikedBy,
            liked,
              disliked
        });

    } catch (error: any) {
        console.error('Error liking case study:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}