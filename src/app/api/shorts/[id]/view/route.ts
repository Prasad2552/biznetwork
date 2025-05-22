import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import Short, { IShort } from "@/lib/models/Short";
import connectDB from "@/lib/mongodb";

interface UpdatedVideoResponse {
  views: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: shortId } = await params;

    if (!isValidObjectId(shortId)) {
      return NextResponse.json({ error: "Invalid short ID" }, { status: 400 });
    }

    const updatedShort = await Short.findByIdAndUpdate(
      shortId,
      { $inc: { views: 1 } },
      {
        new: true,
      }
    ).lean<IShort | null>();

    if (!updatedShort) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 });
    }

    const response: UpdatedVideoResponse = {
      views: updatedShort.views ?? 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating short view count:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}