import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Webinar from '@/lib/models/Webinar';
import Comment from '@/lib/models/Comment';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    try {
        await connectDB()

        const { content } = await req.json()
        // Await the params object
        const { id: webinarId } = await Promise.resolve(params)
        const userId = req.headers.get('user-id') // Assume user ID is sent in headers
        const username = req.headers.get('username') // Assume username is sent in headers

        if (!userId || !username) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
        }

        const webinar = await Webinar.findById(webinarId)
        if (!webinar) {
        return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
        }

        const newComment = new Comment({
        webinarId,
        userId,
        username,
        content,
        })

        await newComment.save()
        webinar.comments.push(newComment._id)
        webinar.commentCount = (webinar.commentCount || 0) + 1
        await webinar.save()

        return NextResponse.json({ ...newComment.toObject(), commentCount: webinar.commentCount }, { status: 201 })
    } catch (error) {
        console.error('Error adding comment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
 
 export async function GET(
   req: NextRequest,
   { params }: { params: { id: string } }
 ) {
     try {
         await connectDB()
         // Await the params object
         const { id: webinarId } = await Promise.resolve(params)
         const webinar = await Webinar.findById(webinarId)
         if (!webinar) {
         return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
         }
 
        // Fetch all the comments for the webinarId including replies
        const comments = await Comment.find({ webinarId })
         .sort({ createdAt: -1 })
           .lean()
         
        const populatedComments = await Promise.all(comments.map(async (comment) => {
               const replies = await Comment.find({ webinarId: comment.webinarId, _id: { $in: comment.replies } }).lean()
             return { ...comment, replies: replies || []}
           }));
 
         // Calculate the commentCount from the actual comments fetched
         const commentCount = populatedComments.length;
 
         return NextResponse.json({ comments: populatedComments, commentCount })
     } catch (error) {
         console.error('Error fetching comments:', error)
         return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
     }
 }