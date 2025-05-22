import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Video from "@/lib/models/Video";
import { Types, isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: videoId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    if (!isValidObjectId(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const video = await Video.findById(videoId).select("likedBy dislikedBy likes dislikes");
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const existingLike = video.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
    const existingDislike = video.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

    const updateData: any = {};
    let liked = !!existingLike;
    let disliked = !!existingDislike;

    if (existingDislike) {
      updateData.$pull = { dislikedBy: userId };
      updateData.$addToSet = { likedBy: userId };
      updateData.$inc = { dislikes: -1, likes: 1 };
      liked = true;
      disliked = false;
    } else if (existingLike) {
      updateData.$pull = { likedBy: userId };
      updateData.$inc = { likes: -1 };
      liked = false;
    } else {
      updateData.$addToSet = { likedBy: userId };
      updateData.$inc = { likes: 1 };
      liked = true;
    }

    await video.updateOne(updateData);
    const updatedVideo = await Video.findById(videoId).select("likedBy dislikedBy likes dislikes");

    if (!updatedVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({
      likes: updatedVideo.likes,
      dislikes: updatedVideo.dislikes,
      likedBy: updatedVideo.likedBy,
      dislikedBy: updatedVideo.dislikedBy,
      liked,
      disliked,
    });
  } catch (error: any) {
    console.error("Error liking video:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}