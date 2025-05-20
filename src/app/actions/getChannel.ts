//src\app\actions\getChannel.ts

"use server"

import { MongoClient } from "mongodb"
import type { Channel } from "@/types/channel"

export async function getChannel(channelName: string): Promise<Channel | null> {
  try {
    console.log("getChannel received channelName:", channelName)
    const cleanChannelName = channelName.startsWith("@") ? channelName.substring(1) : channelName

    const client = await MongoClient.connect(process.env.MONGODB_URI as string)
    const db = client.db("biznetwork")

    console.log("Searching for channel with name:", cleanChannelName)

    const channel = await db.collection("channels").findOne({
      name: { $regex: new RegExp(`^${cleanChannelName}$`, "i") },
    })

    await client.close()

    if (!channel) {
      return null
    }

    // Explicitly serialize all MongoDB-specific objects and dates
    const serializedChannel: Channel = {
      _id: channel._id.toString(), // Convert ObjectId to string
      name: channel.name,
      description: channel.description,
      subscribers: Number(channel.subscribers) || 0,
      engagements: Number(channel.engagements) || 0,
      logo: channel.logo || "",
      banner: channel.banner || "",
      videoCount: Number(channel.videoCount) || 0,
      blogCount: Number(channel.blogCount) || 0,
      webinarCount: Number(channel.webinarCount) || 0,
      channelName: channel.channelName || "",
      podcastCount: Number(channel.podcastCount) || 0,
      caseStudyCount: Number(channel.caseStudyCount) || 0,
      infographicCount: Number(channel.infographicCount) || 0,
      whitePaperCount: Number(channel.whitePaperCount) || 0,
      testimonialCount: Number(channel.testimonialCount) || 0,
      ebookCount: Number(channel.ebookCount) || 0,
      demoCount: Number(channel.demoCount) || 0,
      eventCount: Number(channel.eventCount) || 0,
      techNewsCount: Number(channel.techNewsCount) || 0,
      createdAt: channel.createdAt ? new Date(channel.createdAt).toISOString() : "",
      updatedAt: channel.updatedAt ? new Date(channel.updatedAt).toISOString() : "",
      v: Number(channel.v) || 0,
    }

    console.log("Serialized channel:", JSON.stringify(serializedChannel, null, 2))
    return serializedChannel
  } catch (error) {
    console.error("Error fetching channel:", error)
    return null
  }
}

