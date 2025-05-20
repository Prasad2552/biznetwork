import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'
import Blog from '@/lib/models/Blog'

export async function POST(request: Request, { params }: { params: { channelId: string } }) {
  try {
    await dbConnect()

    const { title, content, author } = await request.json()

    const channel = await Channel.findById(params.channelId)
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const newBlog = new Blog({
      title,
      content,
      author,
      channel: params.channelId,
    })

    await newBlog.save()

    // Update blog count for the channel
    channel.blogCount += 1
    await channel.save()

    return NextResponse.json(newBlog, { status: 201 })
  } catch (error) {
    console.error('Error creating blog:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { channelId: string } }) {
  try {
    await dbConnect()

    const blogs = await Blog.find({ channel: params.channelId })

    return NextResponse.json(blogs)
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

