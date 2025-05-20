// migration.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function migrate() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('biznetwork');
        const videos = db.collection('videos');

        const allVideos = await videos.find({}).toArray();

        for (const video of allVideos) {
            // Convert likedBy to strings
            const updatedLikedBy = video.likedBy.map(id => id.toString());
            // Convert dislikedBy to strings
            const updatedDislikedBy = video.dislikedBy.map(id => id.toString());

            await videos.updateOne(
                { _id: video._id },
                {
                    $set: {
                        likedBy: updatedLikedBy,
                        dislikedBy: updatedDislikedBy
                    }
                }
            );
        }

        console.log('Migration complete!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.close();
    }
}

migrate();