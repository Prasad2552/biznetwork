// pages/api/videos/[videoId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb'; // Import your database connection function
import Video from '@/lib/models/Video'; // Import your Video model
import { Types } from 'mongoose';



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();

    const videoId = req.query.videoId;

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Invalid videoId' });
    }

    const video = await Video.findById(new Types.ObjectId(videoId)).lean();

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    console.log("Fetched video:", video);

    res.status(200).json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
}