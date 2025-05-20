// src/app/api/comments/[commentId]/like/route.ts (and dislike/route.ts)
"use server"
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';
import { Types, isValidObjectId } from 'mongoose';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest, { params }: { params: { commentId: string } }) {
    try {
        await connectDB();
        const { commentId } = await Promise.resolve(params);

        // User ID
        let userId: Types.ObjectId | null = null;

        // 1. Authentication using both NextAuth and JWT
        const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (session?.sub) {
            userId = new Types.ObjectId(session.sub);
        } else {
            const authHeader = req.headers.get('authorization');
            const token = authHeader?.substring(7);
            if (token) {
                try {
                    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
                    userId = new Types.ObjectId(decodedToken.userId);
                } catch (jwtError: any) {
                    console.error("JWT verification error:", jwtError);
                    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized: User ID not found' }, { status: 401 });
        }

        // Fetch comment with explicit select
        let comment = await Comment.findById(commentId)
            .select('likedBy dislikedBy likes dislikes')  // Fetch relevant fields
            .exec();

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

          comment.likedBy = (comment.likedBy || [])
        .map((id:string) => (isValidObjectId(id) ? new Types.ObjectId(id).toString() : null))
        .filter(Boolean) as string[];

       comment.dislikedBy = (comment.dislikedBy || [])
            .map((id:string) => (isValidObjectId(id) ? new Types.ObjectId(id).toString() : null))
           .filter(Boolean) as string[];



         comment.likes = comment.likes || 0;
        comment.dislikes = comment.dislikes || 0;

      
             // Convert it to string before performing the operation
         const hasLiked = comment.likedBy.some((id:string) => id === userId.toString());
          const hasDisliked = comment.dislikedBy.some((id:string) => id === userId.toString());


        let updateData: any = {};

        if (hasLiked) {
            // User is unliking
            updateData = {
                $pull: { likedBy: userId.toString() },
                $inc: { likes: -1 }
            };
          } else {
            // User is liking
            updateData = {
                $addToSet: { likedBy: userId.toString() },
                $inc: { likes: 1 }
            };

               //User change from dislike to like: remove dislike first.
               if (hasLiked) {
                // User is unliking
                updateData = {
                    $pull: { likedBy: userId.toString() },
                    $inc: { likes: -1 }
                };
              } else {
                // User is liking
                updateData = {
                    $addToSet: { likedBy: userId.toString() },
                    $inc: { likes: 1 }
                };
    
                   //User change from dislike to like: remove dislike first.
                if (hasDisliked) {
                    updateData.$pull = { dislikedBy: userId.toString() };
                    updateData.$inc = {dislikes: -1}
                }
             }
            }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedComment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        //  PROCESSING THE DATA PROPERLY.
         // Check that data are valid before saving and converting to ObjectId
         updatedComment.likedBy = (updatedComment.likedBy || [])
          .map((id : any) => (isValidObjectId(id) ? new Types.ObjectId(id).toString() : null))
         .filter(Boolean) as string[];

        updatedComment.dislikedBy = (updatedComment.dislikedBy || [])
            .map((id : any) => (isValidObjectId(id) ? new Types.ObjectId(id).toString() : null))
            .filter(Boolean) as string[];

         await updatedComment.save();

         return NextResponse.json({
            likes: updatedComment.likes,
            dislikes: updatedComment.dislikes,
            likedBy: updatedComment.likedBy,
            dislikedBy: updatedComment.dislikedBy,
             liked: !hasLiked,   //  toggle it back to what is correct (to match the action taken)
             disliked: hasDisliked,
        });
    } catch (error: any) {
        console.error('Error disliking comment:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}