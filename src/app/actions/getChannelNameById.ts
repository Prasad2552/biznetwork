// src/app/actions/getChannelNameById.ts
"use server";

import { MongoClient, ObjectId } from "mongodb";

interface ChannelInfo {
    name: string;
    logo: string;
}

export async function getChannelNameById(channelId: string): Promise<ChannelInfo | null> {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI as string);
        const db = client.db("biznetwork");

        if (!ObjectId.isValid(channelId)) {
            console.warn("Invalid channelId:", channelId);
            return null;
        }

        const channel = await db.collection("channels").findOne(
            { _id: new ObjectId(channelId) },
            { projection: { name: 1, logo: 1 } } // Only fetch name and logo
        );

        await client.close();

        return channel ? { name: channel.name, logo: channel.logo } : null;
    } catch (error) {
        console.error("Error fetching channel name and logo by ID:", error);
        return null;
    }
}