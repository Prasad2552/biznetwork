import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import Podcast, { IPodcast } from "@/lib/models/Podcast";
import connectDB from "@/lib/mongodb";

interface UpdatedPodcastResponse {
  views: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: podcastId } = await params;

    if (!isValidObjectId(podcastId)) {
      return NextResponse.json({ error: "Invalid podcast ID" }, { status: 400 });
    }

    const updatedPodcast = await Podcast.findByIdAndUpdate(
      podcastId,
      { $inc: { views: 1 } },
      {
        new: true,
        runValidators: true,
      }
    ).lean<IPodcast | null>();

    if (!updatedPodcast) {
      return NextResponse.json({ error: "Podcast not found" }, { status: 404 });
    }

    const response: UpdatedPodcastResponse = {
      views: updatedPodcast.views ?? 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating podcast view count:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}