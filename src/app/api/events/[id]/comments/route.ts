import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import Event from "@/lib/models/Event";
import Comment from "@/lib/models/Comment";

interface LeanComment {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
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
    const { id: eventId } = await params;
    const userId = req.headers.get("user-id");
    const username = req.headers.get("username");

    if (!userId || !username) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const newComment = new Comment({
      eventId,
      userId,
      username,
      content,
    });

    await newComment.save();
    event.comments.push(newComment._id);
    event.commentCount = (event.commentCount || 0) + 1;
    await event.save();

    return NextResponse.json({ ...newComment.toObject(), commentCount: event.commentCount }, { status: 201 });
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
    const { id: eventId } = await params;

    if (!Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const comments = await Comment.find({ eventId })
      .sort({ createdAt: -1 })
      .lean<LeanComment[]>();

    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          eventId: comment.eventId,
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