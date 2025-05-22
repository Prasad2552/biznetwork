import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Demo from "@/lib/models/Demo";
import Comment from "@/lib/models/Comment";
import { isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  try {
    await connectDB();

    // Authenticate using NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.name) {
      return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const username = session.user.name;

    const { content } = await req.json();
    const { id: demoId } = await params; // Await params to resolve the Promise

    // Validate demoId
    if (!isValidObjectId(demoId)) {
      return NextResponse.json({ error: "Invalid demo ID" }, { status: 400 });
    }

    const demo = await Demo.findById(demoId);
    if (!demo) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    }

    const newComment = new Comment({
      demoId,
      userId,
      username,
      content,
    });

    await newComment.save();
    demo.comments.push(newComment._id);
    demo.commentCount = (demo.commentCount || 0) + 1;
    await demo.save();

    return NextResponse.json({ ...newComment.toObject(), commentCount: demo.commentCount }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  try {
    await connectDB();
    const { id: demoId } = await params; // Await params to resolve the Promise

    // Validate demoId
    if (!isValidObjectId(demoId)) {
      return NextResponse.json({ error: "Invalid demo ID" }, { status: 400 });
    }

    const demo = await Demo.findById(demoId);
    if (!demo) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    }

    // Fetch all comments for the demoId including replies
    const comments = await Comment.find({ demoId })
      .sort({ createdAt: -1 })
      .lean();

    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ demoId: comment.demoId, _id: { $in: comment.replies } }).lean();
        return { ...comment, replies: replies || [] };
      })
    );

    // Calculate the commentCount from the actual comments fetched
    const commentCount = populatedComments.length;

    return NextResponse.json({ comments: populatedComments, commentCount });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}