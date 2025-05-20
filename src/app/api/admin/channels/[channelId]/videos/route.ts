import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'
import Video from '@/lib/models/Video'

export async function POST(request: Request, { params }: { params: { channelId: string } }) {
  try {
    await dbConnect()

    const { title, description, url, thumbnail } = await request.json()

    const channel = await Channel.findById(params.channelId)
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const newVideo = new Video({
      title,
      description,
      url,
      thumbnail,
      channel: params.channelId,
    })

    await newVideo.save()

    // Update video count for the channel
    channel.videoCount += 1
    await channel.save()

    return NextResponse.json(newVideo, { status: 201 })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { channelId: string } }) {
  try {
    await dbConnect()

    const videos = await Video.find({ channel: params.channelId })

    return NextResponse.json(videos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

