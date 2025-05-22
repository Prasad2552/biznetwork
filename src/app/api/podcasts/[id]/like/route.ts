import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Podcast from "@/lib/models/Podcast";
import { Types, isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: podcastId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    if (!isValidObjectId(podcastId)) {
      return NextResponse.json({ error: "Invalid podcast ID" }, { status: 400 });
    }

    const podcast = await Podcast.findById(podcastId).select("likedBy dislikedBy likes dislikes");
    if (!podcast) {
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    }

    const existingLike = podcast.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
    const existingDislike = podcast.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

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

    await podcast.updateOne(updateData);
    const updatedPodcast = await Podcast.findById(podcastId).select("likedBy dislikedBy likes dislikes");

    if (!updatedPodcast) {
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    }

    return NextResponse.json({
      likes: updatedPodcast.likes,
      dislikes: updatedPodcast.dislikes,
      likedBy: updatedPodcast.likedBy,
      dislikedBy: updatedPodcast.dislikedBy,
      liked,
      disliked,
    });
  } catch (error: any) {
    console.error("Error liking podcast:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}