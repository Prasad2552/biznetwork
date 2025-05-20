import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Testimonial from '@/lib/models/Testimonial';
import Comment from '@/lib/models/Comment';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    try {
        await connectDB()

        const { content } = await req.json()
        // Await the params object
        const { id: testimonialId } = await Promise.resolve(params)
        const userId = req.headers.get('user-id') // Assume user ID is sent in headers
        const username = req.headers.get('username') // Assume username is sent in headers

        if (!userId || !username) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
        }

        const testimonial = await Testimonial.findById(testimonialId)
        if (!testimonial) {
        return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
        }

        const newComment = new Comment({
        testimonialId,
        userId,
        username,
        content,
        })

        await newComment.save()
        testimonial.comments.push(newComment._id)
        testimonial.commentCount = (testimonial.commentCount || 0) + 1
        await testimonial.save()

        return NextResponse.json({ ...newComment.toObject(), commentCount: testimonial.commentCount }, { status: 201 })
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
         const { id: testimonialId } = await Promise.resolve(params)
         const testimonial = await Testimonial.findById(testimonialId)
         if (!testimonial) {
         return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
         }
 
        // Fetch all the comments for the Testimonial including replies
        const comments = await Comment.find({ testimonialId })
         .sort({ createdAt: -1 })
           .lean()
         
        const populatedComments = await Promise.all(comments.map(async (comment) => {
               const replies = await Comment.find({ testimonialId: comment.testimonialId, _id: { $in: comment.replies } }).lean()
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