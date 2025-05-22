import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import Short from "@/lib/models/Short";
import Channel from "@/lib/models/Channel";

interface LeanShort {
  _id: Types.ObjectId;
  title: string;
  videoUrl: string;
  channelId: Types.ObjectId;
  views: number;
  likes: number;
  dislikes: number;
  likedBy: Types.ObjectId[];
  dislikedBy: Types.ObjectId[];
  thumbnailUrl: string;
  uploadDate: Date;
}

interface LeanChannel {
  _id: Types.ObjectId;
  name: string;
  logo: string;
}

export async function GET() {
  try {
    await connectDB();

    const shorts = await Short.find(
      {},
      {
        _id: 1,
        title: 1,
        videoUrl: 1,
        channelId: 1,
        views: 1,
        likes: 1,
        dislikes: 1,
        likedBy: 1,
        dislikedBy: 1,
        thumbnailUrl: 1,
        uploadDate: 1,
      }
    )
      .sort({ uploadDate: -1 })
      .limit(20)
      .lean<LeanShort[]>();

    const populatedShorts = await Promise.all(
      shorts.map(async (short) => {
        let channel: LeanChannel | null = null;

        if (short.channelId) {
          try {
            channel = await Channel.findById(short.channelId)
              .select("name logo")
              .lean<LeanChannel | null>();
          } catch (error) {
            console.error(`Error fetching channel for short ${short._id}:`, error);
          }
        } else {
          console.warn(`Short ${short._id} is missing channelId`);
        }

        return {
          ...short,
          channel: {
            name: channel?.name || "Unknown Channel",
            logo: channel?.logo || "/placeholder.svg",
          },
          thumbnailUrl: short.thumbnailUrl || "/Uploads/placeholder.svg",
        };
      })
    );

    return NextResponse.json({ shorts: populatedShorts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching shorts:", error);
    return NextResponse.json({ error: "Failed to fetch shorts" }, { status: 500 });
  }
}