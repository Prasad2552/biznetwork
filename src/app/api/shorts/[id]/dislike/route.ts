import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Short from "@/lib/models/Short";
import { Types, isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: shortId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    if (!isValidObjectId(shortId)) {
      return NextResponse.json({ error: "Invalid short ID" }, { status: 400 });
    }

    const short = await Short.findById(shortId).select("likedBy dislikedBy likes dislikes");
    if (!short) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 });
    }

    const existingLike = short.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
    const existingDislike = short.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

    const updateData: any = {};
    let liked = !!existingLike;
    let disliked = !!existingDislike;

    if (existingLike) {
      updateData.$pull = { likedBy: userId };
      updateData.$addToSet = { dislikedBy: userId };
      updateData.$inc = { likes: -1, dislikes: 1 };
      liked = false;
      disliked = true;
    } else if (existingDislike) {
      updateData.$pull = { dislikedBy: userId };
      updateData.$inc = { dislikes: -1 };
      disliked = false;
    } else {
      updateData.$addToSet = { dislikedBy: userId };
      updateData.$inc = { dislikes: 1 };
      disliked = true;
    }

    await short.updateOne(updateData);
    const updatedShort = await Short.findById(shortId).select("likedBy dislikedBy likes dislikes");

    if (!updatedShort) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 });
    }

    return NextResponse.json({
      likes: updatedShort.likes,
      dislikes: updatedShort.dislikes,
      likedBy: updatedShort.likedBy,
      dislikedBy: updatedShort.dislikedBy,
      liked,
      disliked,
    });
  } catch (error: any) {
    console.error("Error disliking short:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}