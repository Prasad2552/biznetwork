// src\app\api\users\dislike\route.ts -
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

    // Check if the user has already disliked the post
    const techNews = await techNewsCollection.findOne({ _id: techNewsObjectId });

    if (!techNews) {
      return NextResponse.json({ message: 'Tech News not found' }, { status: 404 });
    }

    const hasLiked = techNews.likeBy && techNews.likeBy.some((id: ObjectId) => id.equals(userObjectId));
    const hasDisliked = techNews.dislikeBy && techNews.dislikeBy.some((id: ObjectId) => id.equals(userObjectId));

    if (hasDisliked) {
      // If already disliked, remove the dislike
      await techNewsCollection.updateOne(
        { _id: techNewsObjectId },
        {
          $pull: { dislikeBy: userObjectId },
          $inc: { dislikes: -1 },
        }
      );
    } else {
      // If not disliked, add the dislike
      await techNewsCollection.updateOne(
        { _id: techNewsObjectId },
        {
          $addToSet: { dislikeBy: userObjectId },
          $inc: { dislikes: 1 },
          $pull: { likeBy: userObjectId } // Remove like if user has liked the post earlier
        }
      );
      if (hasLiked) {
        await techNewsCollection.updateOne(
          { _id: techNewsObjectId },
          {
            $pull: { likeBy: userObjectId },
            $inc: { likes: -1 },
          }
        );
      }
    }
            const updatedNews = await techNewsCollection.findOne({ _id: techNewsObjectId });

    return NextResponse.json( { likes: updatedNews?.likes , dislikes: updatedNews?.dislikes} , { status: 200 });

  } catch (error) {
    console.error('Error disliking the post:', error);
    return NextResponse.json({ message: 'Failed to update dislike', error }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
