import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Types, isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Video from "@/lib/models/Video";

interface LeanVideo {
  _id: Types.ObjectId;
  watchedBy: Types.ObjectId[];
  channelId: { name: string; logo: string };
  [key: string]: any;
}

// PUT request to add video to history
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const videoId = new Types.ObjectId(id);
    const userId = new Types.ObjectId(session.user.id);

    const video = await Video.findById(videoId);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.watchedBy.includes(userId)) {
      video.watchedBy.push(userId);
      await video.save();
    }

    return NextResponse.json({ message: "Added to history" });
  } catch (error) {
    console.error("Error adding video to history:", error);
    return NextResponse.json({ error: "Failed to add video to history" }, { status: 500 });
  }
}

// GET request to retrieve user's history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const userId = new Types.ObjectId(id);

    const watchedVideos = await Video.find({ watchedBy: userId })
      .populate({
        path: "channelId",
        select: "name logo",
      })
      .sort({ updatedAt: -1 })
      .lean<LeanVideo[]>();

    const modifiedVideos = watchedVideos.map((video) => ({
      ...video,
      channel: video.channelId?.name || "Unknown Channel",
      channelLogo: video.channelId?.logo || "/placeholder.svg",
    }));

    return NextResponse.json(modifiedVideos);
  } catch (error) {
    console.error("Error fetching user history:", error);
    return NextResponse.json({ error: "Failed to fetch user history" }, { status: 500 });
  }
}