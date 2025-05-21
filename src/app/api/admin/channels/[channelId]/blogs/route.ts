// src/app/api/admin/channels/[channelId]/blogs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Channel from '@/lib/models/Channel';
import Blog from '@/lib/models/Blog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params; // Await the Promise to get the params object
  try {
    await dbConnect();
    const blogs = await Blog.find({ channel: channelId });
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params; // Await the Promise to get the params object
  try {
    await dbConnect();
    const { title, content, author } = await request.json();
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }
    const newBlog = new Blog({ title, content, author, channel: channelId });
    await newBlog.save();
    channel.blogCount = (channel.blogCount || 0) + 1;
    await channel.save();
    return NextResponse.json(newBlog, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}