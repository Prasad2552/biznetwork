import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Demo from "@/lib/models/Demo";
import { Types, isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is a Promise
) {
  try {
    await connectDB();
    const { id: demoId } = await params; // Await params to resolve the Promise

    // Authenticate using NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    // Validate demoId
    if (!isValidObjectId(demoId)) {
      return NextResponse.json({ error: "Invalid demo ID" }, { status: 400 });
    }

    const demo = await Demo.findById(demoId).select("likedBy dislikedBy likes dislikes");
    if (!demo) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    }

    // Check if user has liked or disliked
    const existingLike = demo.likedBy?.find((user: Types.ObjectId) => user.equals(userId));
    const existingDislike = demo.dislikedBy?.find((user: Types.ObjectId) => user.equals(userId));

    const updateData: any = {};
    let liked = !!existingLike; // Preserve initial like state
    let disliked = !!existingDislike; // Preserve initial dislike state

    if (existingLike) {
      // User has liked, remove like and add dislike
      updateData.$pull = { likedBy: userId };
      updateData.$addToSet = { dislikedBy: userId };
      updateData.$inc = { likes: -1, dislikes: 1 };
      liked = false;
      disliked = true;
    } else if (existingDislike) {
      // User has disliked, remove dislike
      updateData.$pull = { dislikedBy: userId };
      updateData.$inc = { dislikes: -1 };
      disliked = false;
    } else {
      // User hasn't liked or disliked, add dislike
      updateData.$addToSet = { dislikedBy: userId };
      updateData.$inc = { dislikes: 1 };
      disliked = true;
    }

    await demo.updateOne(updateData);
    const updatedDemo = await Demo.findById(demoId).select("likedBy dislikedBy likes dislikes");

    if (!updatedDemo) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    }

    return NextResponse.json({
      likes: updatedDemo.likes,
      dislikes: updatedDemo.dislikes,
      likedBy: updatedDemo.likedBy,
      dislikedBy: updatedDemo.dislikedBy,
      liked,
      disliked,
    });
  } catch (error: any) {
    console.error("Error disliking demo:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}