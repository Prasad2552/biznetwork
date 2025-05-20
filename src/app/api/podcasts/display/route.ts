import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
    let client;
    try {
        client = await MongoClient.connect(process.env.MONGODB_URI || '');
        const db = client.db('biznetwork');

        const podcasts = await db.collection('podcasts').aggregate([
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
               type:1,
                
            },
          },
        ]).toArray();

          const podcastsWithFullUrls = podcasts.map(podcast => ({
                ...podcast,
                 channelLogo:  podcast.channelLogo,
               thumbnailUrl: podcast.featureImageUrl,
               videoUrl: podcast.filePath,
                 type: podcast.type || 'podcast'
            }));
        return NextResponse.json(podcastsWithFullUrls);

    } catch (error) {
        console.error('Error fetching podcasts:', error);
        return NextResponse.json({ error: 'Failed to fetch podcasts' }, { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}