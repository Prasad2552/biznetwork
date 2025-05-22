import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Types, isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Webinar from "@/lib/models/Webinar";
import Comment from "@/lib/models/Comment";

interface LeanComment {
  _id: Types.ObjectId;
  webinarId: Types.ObjectId;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
  replies: Types.ObjectId[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { content } = await req.json();
    const { id: webinarId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.name) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    if (!isValidObjectId(webinarId)) {
      return NextResponse.json({ error: "Invalid webinar ID" }, { status: 400 });
    }

    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const newComment = new Comment({
      webinarId,
      userId: session.user.id,
      username: session.user.name,
      content,
    });

    await newComment.save();
    webinar.comments.push(newComment._id);
    webinar.commentCount = (webinar.commentCount || 0) + 1;
    await webinar.save();

    return NextResponse.json(
      { ...newComment.toObject(), commentCount: webinar.commentCount },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: webinarId } = await params;

    if (!isValidObjectId(webinarId)) {
      return NextResponse.json({ error: "Invalid webinar ID" }, { status: 400 });
    }

    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const comments = await Comment.find({ webinarId })
      .sort({ createdAt: -1 })
      .lean<LeanComment[]>();

    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          webinarId: comment.webinarId,
          _id: { $in: comment.replies },
        }).lean<LeanComment[]>();
        return { ...comment, replies: replies || [] };
      })
    );

    const commentCount = populatedComments.length;

    return NextResponse.json({ comments: populatedComments, commentCount });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}