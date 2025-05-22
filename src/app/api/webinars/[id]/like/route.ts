import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Webinar from "@/lib/models/Webinar";
import { Types, isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: webinarId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    if (!isValidObjectId(webinarId)) {
      return NextResponse.json({ error: "Invalid webinar ID" }, { status: 400 });
    }

    const webinar = await Webinar.findById(webinarId).select("likedBy dislikedBy likes dislikes");
    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const existingLike = webinar.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
    const existingDislike = webinar.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

    const updateData: any = {};
    let liked = !!existingLike;
    let disliked = !!existingDislike;

    if (existingLike) {
      updateData.$pull = { likedBy: userId };
      updateData.$inc = { likes: -1 };
      liked = false;
    } else {
      updateData.$addToSet = { likedBy: userId };
      updateData.$inc = { likes: 1 };
      liked = true;

      if (existingDislike) {
        updateData.$pull = { ...updateData.$pull, dislikedBy: userId };
        updateData.$inc = { ...updateData.$inc, dislikes: -1 };
        disliked = false;
      }
    }

    await webinar.updateOne(updateData);
    const updatedWebinar = await Webinar.findById(webinarId).select("likedBy dislikedBy likes dislikes");

    if (!updatedWebinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    return NextResponse.json({
      likes: updatedWebinar.likes,
      dislikes: updatedWebinar.dislikes,
      likedBy: updatedWebinar.likedBy,
      dislikedBy: updatedWebinar.dislikedBy,
      liked,
      disliked,
    });
  } catch (error: any) {
    console.error("Error liking webinar:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}