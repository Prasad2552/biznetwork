// src/app/api/users/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function POST(req: NextRequest) {
  try {
    const { techNewsId, userId } = await req.json();

    if (!techNewsId || !userId) {
      return NextResponse.json({ message: 'Tech News ID and User ID are required' }, { status: 400 });
    }

    await client.connect();
    const database = client.db('biznetwork');
    const techNewsCollection = database.collection('technews');

    const techNewsObjectId = new ObjectId(techNewsId);
    const userObjectId = new ObjectId(userId);


    // Check if the user has already liked the post
    const techNews = await techNewsCollection.findOne({ _id: techNewsObjectId });

    if (!techNews) {
      return NextResponse.json({ message: 'Tech News not found' }, { status: 404 });
    }

    const hasLiked = techNews.likeBy && techNews.likeBy.some((id: ObjectId) => id.equals(userObjectId));
    const hasDisliked = techNews.dislikeBy && techNews.dislikeBy.some((id: ObjectId) => id.equals(userObjectId));

    if (hasLiked) {
      // If already liked, remove the like
      await techNewsCollection.updateOne(
        { _id: techNewsObjectId },
        {
          $pull: { likeBy: userObjectId },
          $inc: { likes: -1 },
        }
      );
    } else {
      // If not liked, add the like
      await techNewsCollection.updateOne(
        { _id: techNewsObjectId },
        {
          $addToSet: { likeBy: userObjectId },
          $inc: { likes: 1 },
          $pull: { dislikeBy: userObjectId }
        }
      );

      // Remove dislike if user has disliked the post earlier
      if (hasDisliked) {
        await techNewsCollection.updateOne(
          { _id: techNewsObjectId },
          {
            $pull: { dislikeBy: userObjectId },
            $inc: { dislikes: -1 },
          }
        );
      }
    }
    
    const updatedNews = await techNewsCollection.findOne({ _id: techNewsObjectId });

    return NextResponse.json( { likes: updatedNews?.likes , dislikes: updatedNews?.dislikes} , { status: 200 });
  } catch (error) {
    console.error('Error liking the post:', error);
    return NextResponse.json({ message: 'Failed to update like', error }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}