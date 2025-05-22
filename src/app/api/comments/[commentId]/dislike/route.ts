import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectDB from "@/lib/mongodb";
import Comment from "@/lib/models/Comment";
import { Types, isValidObjectId } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> } // params is a Promise
) {
  try {
    await connectDB();
    const { commentId } = await params; // Await params to resolve the Promise

    // Authenticate using NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const userId = new Types.ObjectId(session.user.id);

    // Validate commentId
    if (!isValidObjectId(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    // Fetch comment with explicit select
    const comment = await Comment.findById(commentId)
      .select("likedBy dislikedBy likes dislikes")
      .exec();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Clean IDs: Convert to strings and filter invalid IDs
    comment.likedBy = (comment.likedBy || [])
      .map((id: string) => (isValidObjectId(id) ? new Types.ObjectId(id).toString() : null))
      .filter(Boolean) as string[];

    comment.dislikedBy = (comment.dislikedBy || [])
      .map((id: string) => (isValidObjectId(id) ? new Types.ObjectId(id).toString() : null))
      .filter(Boolean) as string[];

    comment.likes = comment.likes || 0;
    comment.dislikes = comment.dislikes || 0;

    // Check if user has liked or disliked
    const hasLiked = comment.likedBy.includes(userId.toString());
    const hasDisliked = comment.dislikedBy.includes(userId.toString());

    let updateData: any = {};

    if (hasDisliked) {
      // Remove dislike
      updateData = {
        $pull: { dislikedBy: userId.toString() },
        $inc: { dislikes: -1 },
      };
    } else {
      // Add dislike
      updateData = {
        $addToSet: { dislikedBy: userId.toString() },
        $inc: { dislikes: 1 },
      };

      // If user liked, remove like
      if (hasLiked) {
        updateData.$pull = { ...(updateData.$pull || {}), likedBy: userId.toString() };
        updateData.$inc = { ...(updateData.$inc || {}), likes: -1 };
      }
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Process updated comment data
    updatedComment.likedBy = (updatedComment.likedBy || [])
      .map((id: any) => (isValidObjectId(id) ? new Types.ObjectId(id).toString() : null))
      .filter(Boolean) as string[];

    updatedComment.dislikedBy = (updatedComment.dislikedBy || [])
      .map((id: any) => (isValidObjectId(id) ? new Types.ObjectId(id).toString() : null))
      .filter(Boolean) as string[];

    return NextResponse.json({
      likes: updatedComment.likes,
      dislikes: updatedComment.dislikes,
      likedBy: updatedComment.likedBy,
      dislikedBy: updatedComment.dislikedBy,
      liked: hasLiked,
      disliked: !hasDisliked, // Reflect the new state (true if just disliked, false if removed dislike)
    });
  } catch (error: any) {
    console.error("Error disliking comment:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}