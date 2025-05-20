// src\app\api\users\save\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { PullOperator } from 'mongodb'; //Import pull operator
import { Document } from 'mongoose';//Import document

const uri = process.env.MONGODB_URI!;

// Create a single MongoClient instance and reuse it
const client = new MongoClient(uri);
let isConnected = false; // Track connection status

async function connectToDatabase() {
    if (!isConnected) {
        try {
            await client.connect();
            isConnected = true;
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error; // Re-throw the error to be caught by the handler
        }
    }
    return client.db('biznetwork'); // Return the database instance
}


export async function POST(req: NextRequest) {
    try {
        const { postId, techNewsId, userId, pdfId, operation } = await req.json();

        if (!userId || (!techNewsId && !postId && !pdfId)) {
            return NextResponse.json({ message: 'User ID and either Tech News ID, Post ID, or PDF ID are required' }, { status: 400 });
        }

        const userObjectId = new ObjectId(userId);

        const database = await connectToDatabase();
        const usersCollection = database.collection('users');

        // Check if the user exists
        const user = await usersCollection.findOne({ _id: userObjectId });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Helper function to handle save/unsave operations
        const handleSaveOperation = async (contentId: string, contentType: 'savedTechNews' | 'savedPosts' | 'savedPDFs') => {
            const contentObjectId = new ObjectId(contentId);

            const isSaved = user[contentType] && user[contentType].some((id: ObjectId) => id.equals(contentObjectId));

            const pullQuery: PullOperator<Document> = { [contentType]: { $eq: contentObjectId } } as any; //Added types

            if (operation === 'remove' || isSaved) {
                // If already saved or operation is remove, remove
                await usersCollection.updateOne(
                    { _id: userObjectId },
                    { $pull:  pullQuery}
                );
                return NextResponse.json({ message: `${contentType.replace('saved', '').replace(/s$/, '')} unsaved successfully` }, { status: 200 });
            } else {
                // If not saved or operation is add, add
                await usersCollection.updateOne(
                    { _id: userObjectId },
                    { $addToSet: { [contentType]: contentObjectId } }
                );
                return NextResponse.json({ message: `${contentType.replace('saved', '').replace(/s$/, '')} saved successfully` }, { status: 200 });
            }
        };

        if (techNewsId) {
            return handleSaveOperation(techNewsId, 'savedTechNews');
        } else if (postId) {
            return handleSaveOperation(postId, 'savedPosts');
        } else if (pdfId) {
            return handleSaveOperation(pdfId, 'savedPDFs');
        } else {
            return NextResponse.json({ message: 'Invalid request: Content ID not provided' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error saving content:', error);
        return NextResponse.json({ message: 'Failed to save content', error }, { status: 500 });
    }
}