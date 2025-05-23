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

    const postsWithChannelInfo = await Promise.all(
      posts.map(async (post) => {
        let channel;
        if (post.channelId) {
          channel = await channelsCollection.findOne({ _id: new ObjectId(post.channelId) });
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        post.channelLogo = channel?.logo?.startsWith('/') && !channel?.logo?.startsWith('/uploads/')
          ? baseUrl + channel.logo
          : channel?.logo || '/placeholder.svg';
        post.author = channel?.name || 'Unknown Channel';
        post.channelName = channel?.name || 'Unknown Channel';

        return post;
      })
    );

    const res = NextResponse.json({ posts: postsWithChannelInfo });
    res.headers.set('Access-Control-Allow-Origin', 'https://www.biznetworq.com');
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return res;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    const res = NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', 'https://www.biznetworq.com');
    return res;
  } finally {
    if (client) {
      await client.close();
    }
  }
}
