import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Channel from '@/lib/models/Channel'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  context: { params: { channelId: string } }
) {
  try {
    await dbConnect()

    const { channelId } = context.params

    // Validate channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return NextResponse.json(
        { error: 'Invalid channel ID format' },
        { status: 400 }
      )
    }

    const channel = await Channel.findById(channelId)

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // Extract content counts from channel document
    const contentCounts = {
      videos: channel.videoCount || 0,
      blogs: channel.blogCount || 0,
      webinars: channel.webinarCount || 0,
      podcasts: channel.podcastCount || 0,
      caseStudies: channel.caseStudyCount || 0,
      infographics: channel.infographicCount || 0,
      whitePapers: channel.whitePaperCount || 0,
      testimonials: channel.testimonialCount || 0,
      ebooks: channel.ebookCount || 0,
      demos: channel.demoCount || 0,
      events: channel.eventCount || 0
    }

    return NextResponse.json(contentCounts)
  } catch (error) {
    console.error('Error fetching content counts:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

