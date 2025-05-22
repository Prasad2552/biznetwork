import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Event from "@/lib/models/Event";
import { Types, isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: eventId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    if (!isValidObjectId(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const event = await Event.findById(eventId).select("likedBy dislikedBy likes dislikes");
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existingLike = event.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
    const existingDislike = event.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

    const updateData: any = {};
    let liked = !!existingLike;
    let disliked = !!existingDislike;

    if (existingLike) {
      updateData.$pull = { likedBy: userId };
      updateData.$inc = { likes: -1 };
      liked = false;
    } else {
      updateData.$addToSet = { likedBy: userId };
      updateData.$inc = { likes: 1 };
      liked = true;

      if (existingDislike) {
        updateData.$pull = { ...updateData.$pull, dislikedBy: userId };
        updateData.$inc = { ...updateData.$inc, dislikes: -1 };
        disliked = false;
      }
    }

    await event.updateOne(updateData);
    const updatedEvent = await Event.findById(eventId).select("likedBy dislikedBy likes dislikes");

    if (!updatedEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      likes: updatedEvent.likes ?? 0,
      dislikes: updatedEvent.dislikes ?? 0,
      likedBy: updatedEvent.likedBy ?? [],
      dislikedBy: updatedEvent.dislikedBy ?? [],
      liked,
      disliked,
    });
  } catch (error: any) {
    console.error("Error liking event:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}