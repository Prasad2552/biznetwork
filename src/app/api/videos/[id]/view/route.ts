import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import Video from "@/lib/models/Video";
import type { Video as VideoType } from "@/types/common";
import connectDB from "@/lib/mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: videoId } = await params;

    if (!isValidObjectId(videoId)) {
      return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    ).lean<VideoType | null>();

    if (!updatedVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ views: updatedVideo.views });
  } catch (error) {
    console.error("Error updating video view count:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}