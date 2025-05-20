//src\app\api\admin\channels\[channelId]\content\route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { Model, Types } from 'mongoose'
import Video from '@/lib/models/Video'
import Blog from '@/lib/models/Blog'
import Webinar from '@/lib/models/Webinar'
import Podcast from '@/lib/models/Podcast'
import CaseStudy from '@/lib/models/CaseStudy'
import Testimonial from '@/lib/models/Testimonial'
import Demo from '@/lib/models/Demo'
import Event from '@/lib/models/Event'
import { BaseContent, ContentResponse,  ContentType} from '@/types/content'
import PDFModel from '@/lib/models/PDF'


interface ModelType {
  model: Model<BaseContent>
  name: ContentType | 'pdfs';
}

export async function GET(
    request: NextRequest,
    { params }: { params: { channelId: string } }
) {
    try {
        const { channelId } = await params

        // Ensure channelId is valid
        if (!channelId || !Types.ObjectId.isValid(channelId)) {
            return NextResponse.json(
                { error: 'Invalid channel ID' },
                { status: 400 }
            )
        }

        // Connect to the database
        await dbConnect()

        // Define the content models and types
        const contentTypes: ModelType[] = [
            { model: Video, name: 'videos' },
            { model: Blog, name: 'blogs' },
            { model: Webinar, name: 'webinars' },
            { model: Podcast, name: 'podcasts' },
            { model: CaseStudy, name: 'caseStudies' },
             { model: PDFModel, name: 'pdfs' },
             { model: Testimonial, name: 'testimonials' },
            { model: Demo, name: 'demos' },
            { model: Event, name: 'events' },
        ];

        // Fetch all content for the given channelId
        const allContent = await Promise.all(
            contentTypes.map(async ({ model, name }) => {
                const items = await model
                    .find({ channelId: new Types.ObjectId(channelId) })
                    .select('title description status createdAt contentType')
                    .lean()
                      .catch(err =>{
                            console.error(`Error fetching ${name}:`, err)
                            return []
                         })
                return items.map((item): ContentResponse => {
                     let type: ContentType | 'pdfs' = name;
                        if (name === 'pdfs') {
                            if(item.contentType === 'ebook'){
                                 type = 'ebooks'
                            } else if (item.contentType === 'infographic'){
                                type = 'infographics'
                            }else if(item.contentType === 'whitepaper'){
                                type = 'whitePapers'
                            }

                     }
                    return ({
                    _id: item._id.toString(),
                    title: item.title || 'Untitled',
                    type: type,
                    status: item.status || 'draft',
                    description: item.description,
                    createdAt: item.createdAt instanceof Date
                        ? item.createdAt.toISOString()
                        : new Date().toISOString(),
                })});
            })
        )

        // Flatten the content and return it
        const flattenedContent = allContent.flat()


        // If no content, return an empty array
        if (flattenedContent.length === 0) {
            return NextResponse.json([], { status: 200 })
        }

        // Return the flattened content
        return NextResponse.json(flattenedContent)

    } catch (error) {
        console.error('Error fetching content:', error)
        return NextResponse.json(
            { error: 'Failed to fetch content' },
            { status: 500 }
        )
    }
}