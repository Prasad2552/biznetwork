import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
    let client;
    try {
        client = await MongoClient.connect(process.env.MONGODB_URI || '');
        const db = client.db('biznetwork');

        const webinars = await db.collection('webinars').aggregate([
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
                views: { $ifNull: ['$views', 0] }, // Ensure views field exists
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
            },
          },
        ]).toArray();

         // Construct full URLs if needed
         const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const webinarsWithFullUrls = webinars.map(webinar => ({
            ...webinar,
            channelLogo: webinar.channelLogo?.startsWith('/') && !webinar.channelLogo?.startsWith('/uploads/')
                ? baseUrl + webinar.channelLogo
                : webinar.channelLogo,
             thumbnailUrl: webinar.featureImageUrl?.startsWith('/') && !webinar.featureImageUrl?.startsWith('/uploads/')
               ? baseUrl + webinar.featureImageUrl
                : webinar.featureImageUrl,
                 videoUrl: webinar.filePath?.startsWith('/') && !webinar.filePath?.startsWith('/uploads/')
               ? baseUrl + webinar.filePath
                : webinar.filePath,

        }));
    
        return NextResponse.json(webinarsWithFullUrls);

    } catch (error) {
        console.error('Error fetching webinars:', error);
        return NextResponse.json({ error: 'Failed to fetch webinars' }, { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}