import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import Testimonial, { ITestimonial } from "@/lib/models/Testimonial";
import connectDB from "@/lib/mongodb";

interface UpdatedTestimonialResponse {
  views: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: testimonialId } = await params;

    if (!isValidObjectId(testimonialId)) {
      return NextResponse.json({ error: "Invalid testimonial ID" }, { status: 400 });
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      testimonialId,
      { $inc: { views: 1 } },
      {
        new: true,
        runValidators: true,
      }
    ).lean<ITestimonial | null>();

    if (!updatedTestimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const response: UpdatedTestimonialResponse = {
      views: updatedTestimonial.views ?? 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating testimonial view count:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}