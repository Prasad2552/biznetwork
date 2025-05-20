import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
    let client;
    try {
        client = await MongoClient.connect(process.env.MONGODB_URI || '');
        const db = client.db('biznetwork');

        const testimonials = await db.collection('testimonials').aggregate([
          {
            $lookup: {
              from: 'channels',
              localField: 'channelId',
              foreignField: '_id',
              as: 'channelInfo',
            },
          },
          {
            $unwind: {
              path: '$channelInfo',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              channel: { $ifNull: ['$channelInfo.name', 'Unknown Channel'] },
              channelLogo: { $ifNull: ['$channelInfo.logo', '/placeholder.svg'] },
                views: { $ifNull: ['$views', 0] },
            },
          },
          {
            $addFields: {
                type: 'testimonial'
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              filePath: 1,
              featureImageUrl: 1,
              views: 1,
              likes: 1,
              dislikes: 1,
              channel: 1,
              channelLogo: 1,
              createdAt:1,
                 duration: 1,
                  commentCount: 1,
                 type: 1
                
            },
          },
        ]).toArray();

          const testimonialsWithFullUrls = testimonials.map(testimonial => ({
                ...testimonial,
                 channelLogo:  testimonial.channelLogo,
               thumbnailUrl: testimonial.featureImageUrl,
               videoUrl: testimonial.filePath,
             type: testimonial.type
            }));
        return NextResponse.json(testimonialsWithFullUrls);

    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}