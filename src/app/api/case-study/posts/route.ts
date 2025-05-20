import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

export async function GET() {
    let client;
    try {
        client = await MongoClient.connect(process.env.MONGODB_URI || '');
        const db = client.db('biznetwork');
        const collection = db.collection('casestudies');
        const channelsCollection = db.collection('channels');

        const posts = await collection.find({}).toArray();

        // Fetch and add channel information for each post
        const postsWithChannelInfo = await Promise.all(
            posts.map(async (post) => {
                 let channel;
               if (post.channelId) {
               try {
               channel = await channelsCollection.findOne({ _id: new ObjectId(post.channelId) });
                 } catch (error) {
              console.error(`Error fetching channel information for channelId ${post.channelId}`, error);
                 channel = null;
               }
             }
                // Construct full channelLogo URL and set channel name, use default value when needed
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const channelLogo = channel?.logo?.startsWith('/') && !channel?.logo?.startsWith('/uploads/')
                 ? baseUrl + channel.logo
                  : channel?.logo || '/placeholder.svg';

                 const author = channel?.name || 'Unknown Channel';

                const excerpt = post.content
                    ? post.content.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...'
                    : 'No description';
                   const featuredImage = post.featuredImage
                       ?  post.featuredImage?.startsWith('/uploads/') ? baseUrl + post.featuredImage : post.featuredImage
                       : '/placeholder.svg' ;
                return {
                    _id: post._id.toString(),
                   title: post.title || 'Untitled',
                   excerpt: excerpt,
                     createdAt: post.createdAt instanceof Date
                     ? post.createdAt.toISOString()
                     : new Date().toISOString(),
                    featuredImage: featuredImage ,
                    author: author,
                    channelId: post.channelId,
                  channelLogo: channelLogo,
                 views: '0',
                   slug: post.title
                       ? post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                       : 'unknown',
                    tags: [],
                };
            })
        );
      return NextResponse.json(postsWithChannelInfo, { status: 200 });
    } catch (error) {
        console.error('Error fetching case study posts:', error);
        return NextResponse.json({ error: 'Failed to fetch case study posts' }, { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}