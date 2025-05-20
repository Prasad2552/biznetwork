import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Demo from '@/lib/models/Demo';
import Comment from '@/lib/models/Comment';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    try {
        await connectDB()

        const { content } = await req.json()
        // Await the params object
        const { id: demoId } = await Promise.resolve(params)
        const userId = req.headers.get('user-id') // Assume user ID is sent in headers
        const username = req.headers.get('username') // Assume username is sent in headers

        if (!userId || !username) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
        }

        const demo = await Demo.findById(demoId)
        if (!demo) {
        return NextResponse.json({ error: 'Demo not found' }, { status: 404 })
        }

        const newComment = new Comment({
        demoId,
        userId,
        username,
        content,
        })

        await newComment.save()
        demo.comments.push(newComment._id)
        demo.commentCount = (demo.commentCount || 0) + 1
        await demo.save()

        return NextResponse.json({ ...newComment.toObject(), commentCount: demo.commentCount }, { status: 201 })
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
         const { id: demoId } = await Promise.resolve(params)
         const demo = await Demo.findById(demoId)
         if (!demo) {
         return NextResponse.json({ error: 'Demo not found' }, { status: 404 })
         }
 
        // Fetch all the comments for the demoId including replies
        const comments = await Comment.find({ demoId })
         .sort({ createdAt: -1 })
           .lean()
         
        const populatedComments = await Promise.all(comments.map(async (comment) => {
               const replies = await Comment.find({ demoId: comment.demoId, _id: { $in: comment.replies } }).lean()
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