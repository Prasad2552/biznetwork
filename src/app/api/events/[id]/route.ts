import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";
import Video from "@/lib/models/Video";
import connectDB from "@/lib/mongodb";

interface VideoDocument {
  _id: Types.ObjectId;
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  filePath?: string;
  featureImageUrl?: string;
  duration?: number;
  channelId: {
    _id: Types.ObjectId;
    logo: string;
    name: string;
  };
  views: number;
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  type?: "video" | "event";
}

interface EventResponse {
  _id?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  createdAt?: string;
  featuredImage?: string;
  author?: string;
  channelId?: string;
  channelLogo?: string;
  views?: string;
  slug?: string;
  tags?: string[];
  duration?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const post = await Video.findById(id)
      .populate({
        path: "channelId",
        select: "logo name",
      })
      .lean<VideoDocument | null>();

    if (!post || post.type !== "event") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const response: EventResponse = {
      _id: post._id?.toString(),
      title: post.title || "Untitled",
      content: post.description || "",
      excerpt: post.description ? post.description.substring(0, 200) + "..." : "No description",
      createdAt:
        post.createdAt instanceof Date ? post.createdAt.toISOString() : new Date().toISOString(),
      featuredImage:
        post.featureImageUrl?.startsWith("/") && !post.featureImageUrl?.startsWith("/uploads/")
          ? baseUrl + post.featureImageUrl
          : post.featureImageUrl,
      author: post.channelId?.name || "Unknown Author",
      channelId: post.channelId?._id?.toString(),
      channelLogo: post.channelId?.logo || "/placeholder.svg",
      views: post.views?.toString() || "0",
      slug: post.title ? post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "unknown",
      tags: [],
      duration: post.duration?.toString(),
      videoUrl:
        post.filePath?.startsWith("/") && !post.filePath?.startsWith("/uploads/")
          ? baseUrl + post.filePath
          : post.filePath,
      thumbnailUrl:
        post.featureImageUrl?.startsWith("/") && !post.featureImageUrl?.startsWith("/uploads/")
          ? baseUrl + post.featureImageUrl
          : post.featureImageUrl,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in /api/events/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}