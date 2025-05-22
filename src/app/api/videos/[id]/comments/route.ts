import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Types, isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Video from "@/lib/models/Video";
import Comment from "@/lib/models/Comment";

interface LeanComment {
  _id: Types.ObjectId;
  videoId: Types.ObjectId;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
  replies: Types.ObjectId[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: videoId } = await params;

    if (!isValidObjectId(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const video = await Video.findById(videoId).select("comments");
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const comments = await Comment.find({ videoId })
      .sort({ createdAt: -1 })
      .lean<LeanComment[]>();

    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          videoId: comment.videoId,
          _id: { $in: comment.replies },
        }).lean<LeanComment[]>();
        return { ...comment, replies: replies || [] };
      })
    );

    return NextResponse.json({
      comments: populatedComments,
      commentCount: video.comments?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { content } = await req.json();
    const { id: videoId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.name) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    if (!isValidObjectId(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const video = await Video.findById(videoId).select("comments");
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const newComment = new Comment({
      videoId,
      userId: session.user.id,
      username: session.user.name,
      content,
    });

    await newComment.save();

    video.comments = video.comments || [];
    video.comments.push(newComment._id);
    await video.save();

    return NextResponse.json(
      {
        ...newComment.toObject(),
        commentCount: video.comments.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}