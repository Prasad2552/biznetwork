//src\app\api\users\interactions\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get('postId');
    const techNewsId = req.nextUrl.searchParams.get('techNewsId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    if (!postId && !techNewsId) {
      return NextResponse.json({ message: 'Post ID or TechNews ID is required' }, { status: 400 });
    }

    await client.connect();
    const database = client.db('biznetwork');
    const usersCollection = database.collection('users');
    const blogPostsCollection = database.collection('blogposts');
    const techNewsCollection = database.collection('technews');

    const userObjectId = new ObjectId(userId);

    // Fetch user document
    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let hasLiked: boolean | null = null;
    let hasDisliked: boolean | null = null;
    let isSaved: boolean | null = null;

    if (postId) {
      try {
        const postObjectId = new ObjectId(postId); // Attempt to create ObjectId
        const post = await blogPostsCollection.findOne({ _id: postObjectId });

        if (!post) {
          return NextResponse.json({ message: 'Post not found' }, { status: 404 });
        }

        hasLiked = post.likeBy && post.likeBy.some((id: ObjectId) => id.equals(userObjectId));
        hasDisliked = post.dislikeBy && post.dislikeBy.some((id: ObjectId) => id.equals(userObjectId));
        isSaved = user.savedPosts && user.savedPosts.some((id: ObjectId) => id.equals(postObjectId));
      } catch (error) {
        console.error("Invalid postId:", postId);
        // Handle the case where postId is not a valid ObjectId string
        return NextResponse.json({ message: 'Invalid Post ID format' }, { status: 400 });
      }

    } else if (techNewsId) {
      try {
        const techNewsObjectId = new ObjectId(techNewsId);
        const techNews = await techNewsCollection.findOne({ _id: techNewsObjectId });

        if (!techNews) {
          return NextResponse.json({ message: 'Tech News not found' }, { status: 404 });
        }
        hasLiked = techNews.likeBy && techNews.likeBy.some((id: ObjectId) => id.equals(userObjectId));
        hasDisliked = techNews.dislikeBy && techNews.dislikeBy.some((id: ObjectId) => id.equals(userObjectId));
        isSaved = user.savedTechNews && user.savedTechNews.some((id: ObjectId) => id.equals(techNewsObjectId));
       // isSaved = (user.savedTechNews && user.savedTechNews.some((id: ObjectId) => id.equals(techNewsObjectId))) || (user.savedPosts && postId && user.savedPosts.some((id: ObjectId) => id.equals(new ObjectId(postId)))); // removed this redundant logic
      } catch (error) {
        console.error("Invalid techNewsId:", techNewsId);
        // Handle the case where techNewsId is not a valid ObjectId string
        return NextResponse.json({ message: 'Invalid TechNews ID format' }, { status: 400 });
      }
    }

    return NextResponse.json({ hasLiked, hasDisliked, isSaved }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    return NextResponse.json({ message: 'Failed to fetch user interactions', error }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}