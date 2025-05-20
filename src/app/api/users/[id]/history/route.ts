// src/app/api/users/[id]/history/route.ts
import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Video from "@/lib/models/Video"
import { Types } from "mongoose"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"

// PUT request to add video to history 
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB()

        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
 
         const { id } = await params;
 
        const videoId = new Types.ObjectId(id);
         const userId = new Types.ObjectId(session.user.id);


         const video = await Video.findById(videoId);

         if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
         }

         if (!video.watchedBy.includes(userId)) {
             video.watchedBy.push(userId);
             await video.save();
        }
         
         return NextResponse.json({ message: 'Added to history' })
     } catch (error) {
        console.error("Error adding video to history:", error)
        return NextResponse.json({ error: "Failed to add video in history" }, { status: 500 })
    }
}


// GET request to retrieve user's history
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
     try {
         await connectDB();
         const session = await getServerSession(authOptions);
 
         if (!session?.user?.id) {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
         }
 
         const { id } = await params;
         const userId = new Types.ObjectId(id);
 
         // Fetch videos that include the user's ID in watchedBy array and populate the channel
         const watchedVideos = await Video.find({ watchedBy: userId })
              .populate({
                 path: 'channelId',
                 select: 'name logo'  // Select name and logo fields
             })
             .sort({ updatedAt: -1 }).lean();

         const modifiedVideos = watchedVideos.map(video => {
           return {
             ...video,
             channel: video.channelId?.name || "Unknown Channel",
             channelLogo: video.channelId?.logo || "/placeholder.svg"
           }
         })
 
         return NextResponse.json(modifiedVideos);
     } catch (error) {
         console.error("Error fetching user history:", error);
         return NextResponse.json({ error: "Failed to fetch user history" }, { status: 500 });
     }
}