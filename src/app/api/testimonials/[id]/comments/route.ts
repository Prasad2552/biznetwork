import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Types, isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Testimonial from "@/lib/models/Testimonial";
import Comment from "@/lib/models/Comment";

interface LeanComment {
  _id: Types.ObjectId;
  testimonialId: Types.ObjectId;
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
    const { id: testimonialId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.name) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    if (!isValidObjectId(testimonialId)) {
      return NextResponse.json({ error: "Invalid testimonial ID" }, { status: 400 });
    }

    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const newComment = new Comment({
      testimonialId,
      userId: session.user.id,
      username: session.user.name,
      content,
    });

    await newComment.save();
    testimonial.comments.push(newComment._id);
    testimonial.commentCount = (testimonial.commentCount || 0) + 1;
    await testimonial.save();

    return NextResponse.json(
      { ...newComment.toObject(), commentCount: testimonial.commentCount },
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
    const { id: testimonialId } = await params;

    if (!isValidObjectId(testimonialId)) {
      return NextResponse.json({ error: "Invalid testimonial ID" }, { status: 400 });
    }

    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const comments = await Comment.find({ testimonialId })
      .sort({ createdAt: -1 })
      .lean<LeanComment[]>();

    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          testimonialId: comment.testimonialId,
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