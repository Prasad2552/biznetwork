import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Testimonial from "@/lib/models/Testimonial";
import { Types, isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: testimonialId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    if (!isValidObjectId(testimonialId)) {
      return NextResponse.json({ error: "Invalid testimonial ID" }, { status: 400 });
    }

    const testimonial = await Testimonial.findById(testimonialId).select("likedBy dislikedBy likes dislikes");
    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const existingLike = testimonial.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
    const existingDislike = testimonial.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

    const updateData: any = {};
    let liked = !!existingLike;
    let disliked = !!existingDislike;

    if (existingLike) {
      updateData.$pull = { likedBy: userId };
      updateData.$addToSet = { dislikedBy: userId };
      updateData.$inc = { likes: -1, dislikes: 1 };
      liked = false;
      disliked = true;
    } else if (existingDislike) {
      updateData.$pull = { dislikedBy: userId };
      updateData.$inc = { dislikes: -1 };
      disliked = false;
    } else {
      updateData.$addToSet = { dislikedBy: userId };
      updateData.$inc = { dislikes: 1 };
      disliked = true;
    }

    await testimonial.updateOne(updateData);
    const updatedTestimonial = await Testimonial.findById(testimonialId).select("likedBy dislikedBy likes dislikes");

    if (!updatedTestimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    return NextResponse.json({
      likes: updatedTestimonial.likes,
      dislikes: updatedTestimonial.dislikes,
      likedBy: updatedTestimonial.likedBy,
      dislikedBy: updatedTestimonial.dislikedBy,
      liked,
      disliked,
    });
  } catch (error: any) {
    console.error("Error disliking testimonial:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}