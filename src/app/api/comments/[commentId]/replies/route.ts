import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';
import { getToken } from 'next-auth/jwt';

export async function POST(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
    try {
        await connectDB();

        // Get the token and verify authentication
        const token = await getToken({ req });
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content } = await req.json();
        const { commentId } = params;

        // Get user info from the token
        const userId = token.sub; // next-auth stores user ID in sub
        const username = token.name;

        if (!userId || !username) {
            return NextResponse.json({ error: 'User information missing' }, { status: 401 });
        }

        // Find the parent comment
        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
        }

        // Create the reply
        const reply = new Comment({
            videoId: parentComment.videoId,
            userId,
            username,
            content,
            parentCommentId: commentId
        });

        await reply.save();

        // Add the reply to the parent comment's replies array
        parentComment.replies.push(reply._id);
        await parentComment.save();

        return NextResponse.json(reply, { status: 201 });
    } catch (error) {
        console.error('Error adding reply:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
