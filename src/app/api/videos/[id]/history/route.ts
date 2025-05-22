import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isValidObjectId, Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import Video from "@/lib/models/Video";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("PUT /api/videos/[id]/history - Start");
    await connectDB();
    console.log("Database Connected");

    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    const { id } = await params;
    console.log("Video ID:", id);

    if (!session?.user?.id) {
      console.log("Unauthorized access");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(id)) {
      console.log("Invalid video ID format");
      return NextResponse.json({ error: "Invalid video ID format" }, { status: 400 });
    }

    const videoId = new Types.ObjectId(id);
    const userId = new Types.ObjectId(session.user.id);

    console.log("Video ID (ObjectId):", videoId);
    console.log("User ID:", userId);

    const video = await Video.findById(videoId);
    console.log("Video found:", video);

    if (!video) {
      console.log("Error: Video not found");
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.watchedBy) {
      video.watchedBy = [];
    }
    if (!video.watchedBy.includes(userId)) {
      console.log("User not in watchedBy, pushing user ID");
      video.watchedBy.push(userId);
      await video.save();
      console.log("Video updated with user ID");
    } else {
      console.log("User already in watchedBy");
    }

    console.log("PUT /api/videos/[id]/history - End");
    return NextResponse.json({ message: "Added to history" });
  } catch (error: any) {
    console.error("Error adding video to history:", error);
    if (error.name === "BSONError") {
      return NextResponse.json({ error: "Invalid ObjectId format" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to add video in history", details: error.message },
      { status: 500 }
    );
  }
}