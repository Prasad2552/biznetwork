import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import Demo, { IDemo } from "@/lib/models/Demo";
import connectDB from "@/lib/mongodb";

interface UpdatedDemoResponse {
  views: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  try {
    await connectDB();
    const { id: demoId } = await params; // Await params to resolve the Promise

    // Validate demoId
    if (!isValidObjectId(demoId)) {
      return NextResponse.json({ error: "Invalid demo ID" }, { status: 400 });
    }

    const updatedDemo = await Demo.findByIdAndUpdate(
      demoId,
      { $inc: { views: 1 } },
      {
        new: true,
        runValidators: true,
      }
    ).lean() as IDemo | null;

    if (!updatedDemo) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    }

    const response: UpdatedDemoResponse = {
      views: updatedDemo.views ?? 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating demo view count:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}