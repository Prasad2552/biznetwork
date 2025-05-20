import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Video from "@/lib/models/Video"
import Comment from "@/lib/models/Comment"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const { id: videoId } = await Promise.resolve(params)

    // Get the video to get its comments array
    const video = await Video.findById(videoId)
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Fetch all comments for the video including replies
    const comments = await Comment.find({ videoId }).sort({ createdAt: -1 }).lean()

    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ videoId: comment.videoId, _id: { $in: comment.replies } }).lean()
        return { ...comment, replies: replies || [] }
      }),
    )

    return NextResponse.json({
      comments: populatedComments,
      commentCount: video.comments?.length || 0, // Use the comments array length
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()

    const { content } = await req.json()
    const { id: videoId } = await Promise.resolve(params)
    const userId = req.headers.get("user-id")
    const username = req.headers.get("username")

    if (!userId || !username) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const video = await Video.findById(videoId)
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const newComment = new Comment({
      videoId,
      userId,
      username,
      content,
    })

    await newComment.save()

    // Update the video's comments array
    video.comments = video.comments || []
    video.comments.push(newComment._id)
    await video.save()

    return NextResponse.json(
      {
        ...newComment.toObject(),
        commentCount: video.comments.length, // Return the updated comments array length
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

