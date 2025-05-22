import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import Webinar, { IWebinar } from "@/lib/models/Webinar";
import connectDB from "@/lib/mongodb";

interface UpdatedWebinarResponse {
  views: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: webinarId } = await params;

    if (!isValidObjectId(webinarId)) {
      return NextResponse.json({ error: "Invalid webinar ID" }, { status: 400 });
    }

    const updatedWebinar = await Webinar.findByIdAndUpdate(
      webinarId,
      { $inc: { views: 1 } },
      {
        new: true,
        runValidators: true,
      }
    ).lean<IWebinar | null>();

    if (!updatedWebinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const response: UpdatedWebinarResponse = {
      views: updatedWebinar.views ?? 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating webinar view count:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}