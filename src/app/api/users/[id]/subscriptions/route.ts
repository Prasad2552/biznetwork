// src/app/api/users/[id]/subscriptions/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import { Subscription } from '@/lib/models/Subscription';
import  Channel  from '@/lib/models/Channel';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params; // Direct destructuring, no await needed

    if (!session?.user || session.user.id !== id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Fetch user's subscriptions
    const subscriptions = await Subscription.find({ userId: id }).populate({
         path: 'channelId',
         model: Channel,
         select: 'name logo description subscribers author videoCount', //Added videoCount here
    });

    const subscriptionsData = subscriptions.map((subscription) => ({
      channelId: String(subscription.channelId._id),
       channelLogo: subscription.channelId.logo,
       channelName: subscription.channelId.name,
        description: subscription.channelId.description,
        subscriberCount: subscription.channelId.subscribers,
        author: subscription.channelId.author,
        videoCount: subscription.channelId.videoCount, //Added videoCount here
    }));

    return NextResponse.json(subscriptionsData);

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}