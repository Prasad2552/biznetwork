import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import {Subscription} from "@/lib/models/Subscription";
import Channel from "@/lib/models/Channel";

interface LeanChannel {
  _id: string;
  name: string;
  logo: string;
  description: string;
  subscribers: number;
  author: string;
  videoCount: number;
}

interface LeanSubscription {
  userId: string;
  channelId: LeanChannel;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    await connectDB();

    const subscriptions = await Subscription.find({ userId: id })
      .populate({
        path: "channelId",
        model: Channel,
        select: "name logo description subscribers author videoCount",
      })
      .lean<LeanSubscription[]>();

    const subscriptionsData = subscriptions.map((subscription) => ({
      channelId: String(subscription.channelId._id),
      channelLogo: subscription.channelId.logo,
      channelName: subscription.channelId.name,
      description: subscription.channelId.description,
      subscriberCount: subscription.channelId.subscribers,
      author: subscription.channelId.author,
      videoCount: subscription.channelId.videoCount,
    }));

    return NextResponse.json(subscriptionsData);
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json({ error: "Failed to check subscription status" }, { status: 500 });
  }
}