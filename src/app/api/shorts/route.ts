// src/app/api/shorts/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Short from '@/lib/models/Short';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

export async function GET() {
    let client: MongoClient | null = null;

    try {
        await connectDB();

        const shorts = await Short.find(
            {},
            { // Specify fields to be selected
                _id: 1,
                title: 1,
                videoUrl: 1,
                channelId: 1,
                channel: 1,
                views: 1,
                likes: 1,
                dislikes: 1,
                likedBy: 1,
                dislikedBy: 1,
                thumbnailUrl: 1 // Ensure thumbnailUrl is selected
            }
        )
            .sort({ uploadDate: -1 })
            .limit(20)
            .lean()
            .exec();

        client = await new MongoClient(process.env.MONGODB_URI || '').connect();
        const db = client.db(process.env.MONGODB_DB || 'biznetwork');
        const channelCollection = db.collection('channels');

        const populatedShorts = await Promise.all(
            shorts.map(async (short) => {
                let channel = null;

                if (short.channelId) {
                    try {
                        // Key improvement: Convert channelId to ObjectId only if it's a string
                        const channelId = typeof short.channelId === 'string' ? new mongoose.Types.ObjectId(short.channelId) : short.channelId;
                        channel = await channelCollection.findOne({ _id: channelId });
                    } catch (error) {
                        console.error(`Error fetching channel for short ${short._id}:`, error);
                    }
                } else {
                    console.warn(`Short ${short._id} is missing channelId`);
                }

                // Provide default values if channel is not found
                const channelName = channel?.name || 'Unknown Channel';
                const channelLogo = channel?.logo || '/placeholder.svg';

                return {
                    ...short,
                    channel: {
                        name: channelName,
                        logo: channelLogo,
                    },
                      thumbnailUrl: short.thumbnailUrl || '/uploads/placeholder.svg', // Correct value
                    // Explicitly include thumbnailUrl if you have not already done it.
                };
            })
        );


        return NextResponse.json({ shorts: populatedShorts }, { status: 200 });
    } catch (error) {
        console.error('Error fetching shorts:', error);
        return NextResponse.json({ error: 'Failed to fetch shorts' }, { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}