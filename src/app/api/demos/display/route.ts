import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
    let client;
    try {
        client = await MongoClient.connect(process.env.MONGODB_URI || '');
        const db = client.db('biznetwork');

        const demos = await db.collection('demos').aggregate([
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

          const demosWithFullUrls = demos.map(demo => ({
                ...demo,
                 channelLogo:  demo.channelLogo,
               thumbnailUrl: demo.featureImageUrl,
               videoUrl: demo.filePath,
                 type: demo.type || 'demo'
            }));
        return NextResponse.json(demosWithFullUrls);

    } catch (error) {
        console.error('Error fetching demos:', error);
        return NextResponse.json({ error: 'Failed to fetch demos' }, { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}