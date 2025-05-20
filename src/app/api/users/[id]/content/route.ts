// src\app\api\users\[id]\content\route.ts
import { type NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Video from "@/lib/models/Video";
import BlogPost from "@/lib/models/Blog";
import PDFDocumentModel from "@/lib/models/PDF";
import User from "@/lib/models/User";  // Import User model
import { Types } from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import TechNews from "@/lib/models/TechNews"; // Import the TechNews model

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);

        // Extract the ID from the URL using NextRequest
        const userIdFromUrl = req.nextUrl.pathname.split('/')[3];  // Adjust index if needed

        if (!session?.user?.id || session.user.id !== userIdFromUrl) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = new Types.ObjectId(userIdFromUrl);


        // Update the populate to use 'logo' instead of 'logoUrl'
        const likedVideos = await Video.find({ likedBy: userId })
            .populate("channelId", "name logo") // Changed logoUrl to logo
            .select("title description thumbnailUrl uploadDate duration likedBy dislikedBy _id views channelId")
            .lean()

        const dislikedVideos = await Video.find({ dislikedBy: userId })
            .populate("channelId", "name logo") // Changed logoUrl to logo
            .select("title description thumbnailUrl uploadDate duration likedBy dislikedBy _id views channelId")
            .lean()

        // Rest of your blog and PDF queries remain the same
        const likedBlogPosts = await BlogPost.find({ likeBy: userId })
            .populate("channelId", "name logo")  // Populate channelId
            .select("title content excerpt featuredImage createdAt tags author channelId views slug") // also select channelId
            .lean();

        const dislikedBlogPosts = await BlogPost.find({ dislikeBy: userId })
            .populate("channelId", "name logo") // Populate channelId
            .select("title excerpt featuredImage createdAt tags author channelId views slug") //Also select channelId
            .lean();


        interface UserType {
            savedPosts: typeof BlogPost[];
            savedTechNews: typeof TechNews[]; // add this line
            savedPDFs: typeof PDFDocumentModel[];
        }

        const user = await User.findById(userId)
            .populate<{
            savedPosts: typeof BlogPost[];
            savedTechNews: typeof TechNews[];
            savedPDFs: typeof PDFDocumentModel[];

        }>([
                {
                    path: 'savedPosts',
                    select: 'title content excerpt featuredImage createdAt tags author channelId views slug', // Also select channelId
                    populate: {
                        path: 'channelId',
                        select: 'name logo'  // Get channel name and logo
                    },
                    model: BlogPost // Make sure this matches your BlogPost model name
                },
                {
                    path: 'savedTechNews',
                    select: 'title description content url createdAt featuredImage slug', // Include featuredImage and slug
                    model: TechNews
                },
                {
                    path: 'savedPDFs',
                    select: 'title previewUrl imageUrl author dateUploaded channelName channelLogo channelId url slug featureImageUrl createdAt contentType', //ADD the featureImageUrl
                    model: PDFDocumentModel, // Make sure this matches your PDFDocument model name
                }
            ])
            .lean();

        const liked = [
            ...likedVideos.map((item) => ({
                ...item,
                type: "video",
                thumbnailUrl: item.thumbnailUrl,
                uploadDate: item.uploadDate,
                _id: item._id,
                views: item.views,
                // Update to use logo instead of logoUrl
                channel: item.channelId?.name || "Unknown Channel",
                channelLogo: item.channelId?.logo || "/placeholder.svg", // Changed logoUrl to logo
                videoSlug: item._id,
            })),
            ...likedBlogPosts.map((item) => ({
                ...item,
                type: "blogpost",
                thumbnailUrl: item.featuredImage || "/placeholder.svg", // Provide a default value
                uploadDate: item.createdAt,
                _id: item._id,
                views: String(item.views),
                channel: item.channelId?.name || "Unknown Channel", //Changed from item.author
                channelLogo: item.channelId?.logo || "/placeholder.svg", // New one line here
                slug: item.slug || item._id,
                videoSlug: item._id,
                content: item.content,
                excerpt: item.excerpt,
                title: item.title,
            })),
        ]

        const disliked = [
            ...dislikedVideos.map((item) => ({
                ...item,
                type: "video",
                thumbnailUrl: item.thumbnailUrl,
                uploadDate: item.uploadDate,
                _id: item._id,
                views: item.views,
                // Update to use logo instead of logoUrl
                channel: item.channelId?.name || "Unknown Channel",
                channelLogo: item.channelId?.logo || "/placeholder.svg", // Changed logoUrl to logo
                videoSlug: item._id,
            })),
            ...dislikedBlogPosts.map((item) => ({
                ...item,
                type: "blogpost",
                thumbnailUrl: item.featuredImage || "/placeholder.svg", // Provide a default value
                uploadDate: item.createdAt,
                _id: item._id,
                views: String(item.views),
                channel: item.channelId?.name || "Unknown Channel", //Changed from item.author
                channelLogo: item.channelId?.logo || "/placeholder.svg", // New one line here
                slug: item.slug || item._id,
                videoSlug: item._id,
                content: item.content,
                excerpt: item.excerpt,
                title: item.title,
            })),
        ]

        // Make sure `user` is not null or undefined before accessing `savedPosts`
        const savedPosts = user
            ? (user as UserType).savedPosts?.map((item: any) => {
                const blogPostItem = {
                    ...item,
                    type: "blogpost",
                    thumbnailUrl: item.featuredImage || "/placeholder.svg",
                    uploadDate: item.createdAt,
                    _id: item._id,
                    views: String(item.views),
                    channel: item.channelId?.name || item.channel || item.author || "Unknown Channel",
                    channelLogo: item.channelId?.logo || item.channelLogo || item.logo || "/placeholder.svg",
                    slug: item.slug || item._id,
                    videoSlug: item._id,
                };

                return blogPostItem;
            }) || []
            : []

        const savedTechNews = user
            ? (user as UserType).savedTechNews?.map((item: any) => {
                const techNewsItem = {  // Create a temporary variable
                    ...item,
                    type: "technews",
                    thumbnailUrl: item.featuredImage || '/technews_placeholder.png', // tech news thumbnail, use the featured image or the default
                    uploadDate: item.createdAt,
                    _id: item._id,
                    channel: "Tech News", //channel name
                    channelLogo: '/technews_logo.png',//chnanel logo
                    slug: item.slug,
                    videoSlug: item._id,
                    content: item.content,
                    url: item.url,
                    title: item.title,
                    featuredImage: item.featuredImage, //Include featuredImage
                };

                return techNewsItem;
            }) || []
            : []
        const savedPDFs = user
            ? (user as UserType).savedPDFs?.map((item: any) => {
                const pdfDocumentItem = {
                    ...item,
                    type: "pdf",
                    previewUrl: item.previewUrl,
                    uploadDate: item.createdAt,
                    _id: item._id,
                    channel: item.channelName || "Unknown Channel",
                    channelLogo: item.channelLogo || "/placeholder.svg",
                    slug: item.slug,
                    videoSlug: item._id,
                    title: item.title,
                    featureImageUrl: item.featureImageUrl, //Keep image URL
                    contentType: item.contentType,
                };
                return pdfDocumentItem;
            }) || []
            : [];

        const saved = [...savedPosts, ...savedTechNews, ...savedPDFs];

        return NextResponse.json({ liked, disliked, saved })
    } catch (error) {
        console.error("Error fetching user content:", error)
        return NextResponse.json({ error: "Failed to fetch user content" }, { status: 500 })
    }
}