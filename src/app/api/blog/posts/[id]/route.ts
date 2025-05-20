import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

interface BlogPost {
    _id: ObjectId;
    channelId?: string;
    title: string;
    content: string; // Add other relevant properties
    views?: number;
    channelLogo?: string;
    author?: string;
    channelName?: string;
    slug?: string;
}

interface Channel {
    _id: ObjectId;
    name: string;
    logo?: string;
}

export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const { params } = await context;
        const { id } = params;
        await client.connect();
        const database = client.db('biznetwork');
        const blogPostsCollection = database.collection('blogposts');
        const channelsCollection = database.collection('channels');

        let post: BlogPost | null;

        if (ObjectId.isValid(id)) {
            post = await blogPostsCollection.findOne({ _id: new ObjectId(id) }) as BlogPost | null;
        } else {
            post = await blogPostsCollection.findOne({ slug: id }) as BlogPost | null;
        }


        if (!post) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // Increment view count before fetching the channel and after fetching the post
        await blogPostsCollection.updateOne({ _id: post._id }, { $inc: { views: 1 } });
        // Fetch updated post with new view count
        post = await blogPostsCollection.findOne({ _id: post._id }) as BlogPost | null;

        if (!post) {
             return NextResponse.json({ error: 'Blog post not found after view increment' }, { status: 404 });
        }

        // Fetch channel data using channelId
        let channel: Channel | null = null;
        if (post.channelId) {
            channel = await channelsCollection.findOne({ _id: new ObjectId(post.channelId) }) as Channel | null;
        }

        // Construct full channelLogo URL and set channel name, use default value when needed
        if (channel && post) { // Added post check here
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
            post.channelLogo =
                channel.logo?.startsWith('/') && !channel.logo?.startsWith('/uploads/')
                    ? baseUrl + channel.logo
                    : channel.logo;
            post.author = channel.name;
            post.channelName = 'Unknown Channel';
        } else if (post) {
            post.channelLogo = '/placeholder.svg';
            post.author = 'Unknown Channel';
        }
       const postWithType = post ? { ...post, type: 'blogpost' as const } : null;

        return NextResponse.json(postWithType);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blog post' },
            { status: 500 }
        );
    } finally {
        await client.close();
    }
}