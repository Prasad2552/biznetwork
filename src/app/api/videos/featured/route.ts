 // src/app/api/videos/featured/route.ts  (API Route)
 import { NextResponse } from 'next/server'
 import connectDB from '@/lib/mongodb';
 import Video from '@/lib/models/Video'; // Import your video model
 
 export async function GET(request: Request) {
  try {
         await connectDB();
      const video = await Video.findById('67821c94c4c1257f24b57abd');  // Use findById to get a specific video
 
        if (!video) {
             return NextResponse.json({ message: "Video not found" }, { status: 404 });
         }
      return NextResponse.json(video);
    } catch (error) {
       console.error("Error fetching video:", error);
         return NextResponse.json({ message: "Failed to fetch video" }, { status: 500 });
    }
 }