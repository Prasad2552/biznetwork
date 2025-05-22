import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Short from "@/lib/models/Short";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: shortId } = await params;
    const { reportReason } = await req.json();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized: Authentication required" }, { status: 401 });
    }

    if (!isValidObjectId(shortId)) {
      return NextResponse.json({ message: "Invalid short ID" }, { status: 400 });
    }

    if (!reportReason) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const short = await Short.findById(shortId);
    if (!short) {
      return NextResponse.json({ message: "Short not found" }, { status: 404 });
    }

    // TODO: Implement function to add report to database
    return NextResponse.json({ message: "Short reported successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error reporting short:", error);
    return NextResponse.json({ message: "Error reporting short", error: error.message }, { status: 500 });
  }
}