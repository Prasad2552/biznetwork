//src\app\api\admin\content\[type]\[id]\route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Types, Model } from 'mongoose'
import Video from '@/lib/models/Video'
import Blog from '@/lib/models/Blog'
import Webinar from '@/lib/models/Webinar'
import Podcast from '@/lib/models/Podcast'
import CaseStudy from '@/lib/models/CaseStudy'
import Testimonial from '@/lib/models/Testimonial'
import Demo from '@/lib/models/Demo'
import Event from '@/lib/models/Event'
import PDFModel from '@/lib/models/PDF'

interface BaseDocument {
  _id: Types.ObjectId
  title: string
  description?: string
  contentType?: string
  [key: string]: any
}

const models: Record<string, Model<BaseDocument>> = {
  videos: Video,
  blogs: Blog,
  webinars: Webinar,
  podcasts: Podcast,
  caseStudies: CaseStudy,
  testimonials: Testimonial,
  demos: Demo,
  events: Event,
    ebooks: PDFModel,
    infographics: PDFModel,
    whitePapers: PDFModel,
  pdfs: PDFModel,
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    await dbConnect()

    const { type, id } = params
      if (!type || !id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                 { error: 'Invalid parameters' },
                { status: 400 }
            );
        }
        let modelType = type;
        if(type === 'ebooks' || type === 'infographics' || type === 'whitePapers') {
              modelType = 'pdfs';
        }

      const model = models[modelType];

    if (!model) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    const content = await model.findById(id).lean() as BaseDocument | null
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...content,
      _id: content._id.toString(),
    })
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    await dbConnect()

    const { type, id } = params
    if (!type || !id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }
      let modelType = type;
        if(type === 'ebooks' || type === 'infographics' || type === 'whitePapers') {
              modelType = 'pdfs';
        }
    const model = models[modelType]
    if (!model) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updatedContent = await model
      .findByIdAndUpdate(
        id,
        { $set: body },
        { new: true, runValidators: true }
      )
      .lean() as BaseDocument | null

    if (!updatedContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...updatedContent,
      _id: updatedContent._id.toString(),
    })
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    await dbConnect()

    const { type, id } = params
    if (!type || !id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

      let modelType = type;
        if(type === 'ebooks' || type === 'infographics' || type === 'whitePapers') {
              modelType = 'pdfs';
        }
    const model = models[modelType]
    if (!model) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    const deletedContent = await model
      .findByIdAndDelete(id)
      .lean() as BaseDocument | null

    if (!deletedContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      message: 'Content deleted successfully',
      _id: deletedContent._id.toString()
    })
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}