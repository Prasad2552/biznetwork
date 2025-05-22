import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongodb";
import { Subscription } from "@/lib/models/Subscription";
import Channel from "@/lib/models/Channel";
import mongoose from "mongoose";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> } // params is a Promise
) {
  try {
    const session = await getServerSession(authOptions);
    const { channelId } = await params; // Await params to resolve the Promise

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find channel by name or ID
    const channel = await Channel.findOne({
      $or: [
        { name: decodeURIComponent(channelId) },
        ...(mongoose.Types.ObjectId.isValid(channelId) ? [{ _id: channelId }] : []),
      ],
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
      userId: session.user.id,
      channelId: channel._id,
    });

    if (existingSubscription) {
      // If exists, remove subscription and decrement count atomically
      await Promise.all([
        Subscription.deleteOne({
          userId: session.user.id,
          channelId: channel._id,
        }),
        Channel.findByIdAndUpdate(channel._id, { $inc: { subscribers: -1 } }, { new: true }),
      ]);

      const updatedChannel = await Channel.findById(channel._id);

      return NextResponse.json({
        message: "Successfully unsubscribed",
        isSubscribed: false,
        subscriberCount: updatedChannel?.subscribers || 0,
      });
    }

    // Create new subscription and increment count atomically
    await Promise.all([
      Subscription.create({
        userId: session.user.id,
        channelId: channel._id,
      }),
      Channel.findByIdAndUpdate(channel._id, { $inc: { subscribers: 1 } }, { new: true }),
    ]);

    const updatedChannel = await Channel.findById(channel._id);

    return NextResponse.json({
      message: "Successfully subscribed",
      isSubscribed: true,
      subscriberCount: updatedChannel?.subscribers || 0,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> } // params is a Promise
) {
  try {
    const session = await getServerSession(authOptions);
    const { channelId } = await params; // Await params to resolve the Promise

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find channel by name or ID
    const channel = await Channel.findOne({
      $or: [
        { name: decodeURIComponent(channelId) },
        ...(mongoose.Types.ObjectId.isValid(channelId) ? [{ _id: channelId }] : []),
      ],
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    // If user is not logged in, return just the subscriber count
    if (!session?.user) {
      return NextResponse.json({
        isSubscribed: false,
        subscriberCount: channel.subscribers || 0,
      });
    }

    // Check if subscription exists
    const subscription = await Subscription.findOne({
      userId: session.user.id,
      channelId: channel._id,
    });

    return NextResponse.json({
      isSubscribed: !!subscription,
      subscriberCount: channel.subscribers || 0,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}