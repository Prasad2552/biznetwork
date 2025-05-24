import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

interface BlogPost {
  _id: ObjectId;
  channelId?: string;
  title: string;
  content: string;
  views?: number;
  channelLogo?: string;
  author?: string;
  channelName?: string;
  slug?: string;
  featuredImage?: string;
}

interface Channel {
  _id: ObjectId;
  name: string;
  logo?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  // Create a new MongoClient for this request
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    await client.connect();

    const database = client.db('biznetwork');
    const blogPostsCollection = database.collection('blogposts');
    const channelsCollection = database.collection('channels');

    const { id } = await params;

    let post: BlogPost | null;
    if (ObjectId.isValid(id)) {
      post = (await blogPostsCollection.findOne({ _id: new ObjectId(id) })) as BlogPost | null;
    } else {
      post = (await blogPostsCollection.findOne({ slug: id })) as BlogPost | null;
    }

    if (!post) {

      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }
    
    if (typeof post.views !== 'number') {
      await blogPostsCollection.updateOne({ _id: post._id }, { $set: { views: 0 } });
    }
    await blogPostsCollection.updateOne({ _id: post._id }, { $inc: { views: 1 } });

    post = (await blogPostsCollection.findOne({ _id: post._id })) as BlogPost | null;
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found after view increment' }, { status: 404 });
    }

    let channel: Channel | null = null;
    if (post.channelId && ObjectId.isValid(post.channelId)) {
      channel = (await channelsCollection.findOne({ _id: new ObjectId(post.channelId) })) as Channel | null;
    } 

    if (channel && post) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      post.channelLogo =
        channel.logo?.startsWith('/') && !channel.logo?.startsWith('/uploads/')
          ? baseUrl + channel.logo
          : channel.logo || '/placeholder.svg';
      post.author = channel.name;
      post.channelName = channel.name;
    } else if (post) {
      post.channelLogo = '/placeholder.svg';
      post.author = 'Unknown Author';
      post.channelName = 'Unknown Channel';
    }

    return NextResponse.json({ ...post, type: 'blogpost' as const });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch blog post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {

    await client.close().catch((err) => console.error('[ERROR] Failed to close MongoDB connection:', err));
    
  }
}
