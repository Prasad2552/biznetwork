// src\app\api\blog\posts\route.ts

import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function GET() {
  let client;
  try {
    client = await MongoClient.connect(process.env.MONGODB_URI || '');
    const db = client.db('biznetwork');
    const collection = db.collection('blogposts');
    const channelsCollection = db.collection('channels');

    const posts = await collection.find({}).toArray();

    // Fetch and add channel information for each post
    const postsWithChannelInfo = await Promise.all(
      posts.map(async (post) => {
        let channel;
        if (post.channelId) {
          channel = await channelsCollection.findOne({ _id: new ObjectId(post.channelId) });
        }

          // Construct full channelLogo URL and set channel name, use default value when needed
        if (channel) {
           const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
            post.channelLogo = channel.logo?.startsWith('/') && !channel.logo?.startsWith('/uploads/')
               ? baseUrl + channel.logo
               : channel.logo;
              post.author = channel.name;
              post.channelName = channel.name;
       } else {
           post.channelLogo =  '/placeholder.svg';
            post.author = 'Unknown Channel'
            post.channelName = 'Unknown Channel';
        }


        return post;
      })
    );

    return NextResponse.json({ posts: postsWithChannelInfo });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}