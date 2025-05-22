import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Comment from "@/lib/models/Comment";
import { isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> } // params is a Promise
) {
  try {
    await connectDB();

    // Authenticate using NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      return NextResponse.json({ error: "Unauthorized: User information missing" }, { status: 401 });
    }

    const userId = session.user.id;
    const username = session.user.name;

    const { content } = await req.json();
    const { commentId } = await params; // Await params to resolve the Promise

    // Validate commentId
    if (!isValidObjectId(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    // Find the parent comment
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }

    // Create the reply
    const reply = new Comment({
      videoId: parentComment.videoId,
      userId,
      username,
      content,
      parentCommentId: commentId,
    });

    await reply.save();

    // Add the reply to the parent comment's replies array
    parentComment.replies.push(reply._id);
    await parentComment.save();

    return NextResponse.json(reply, { status: 201 });
  } catch (error: any) {
    console.error("Error adding reply:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}