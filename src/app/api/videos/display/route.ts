import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  let client;
  try {
    client = await MongoClient.connect(process.env.MONGODB_URI || '');
    const db = client.db('biznetwork');
    
    const videos = await db.collection('videos').aggregate([
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
          videoUrl: 1,
          thumbnailUrl: 1,
          views: 1,
          likes: 1,
          dislikes: 1,
          
          channel: 1,
          channelLogo: 1,
          uploadDate: 1,
          duration: 1,
          commentCount: 1,
           type: 1
        },
      },
    ]).toArray();

    // Construct full URLs if needed
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const videosWithFullUrls = videos.map(video => ({
      ...video,
      channelLogo: video.channelLogo?.startsWith('/') && !video.channelLogo?.startsWith('/uploads/')
        ? baseUrl + video.channelLogo
        : video.channelLogo,
    }));

    return NextResponse.json(videosWithFullUrls);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}