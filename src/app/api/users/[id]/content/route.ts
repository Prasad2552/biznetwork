import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Types, isValidObjectId } from "mongoose";
import connectDB from "@/lib/mongodb";
import Video from "@/lib/models/Video";
import BlogPost from "@/lib/models/Blog";
import PDFDocumentModel from "@/lib/models/PDF";
import User from "@/lib/models/User";
import TechNews from "@/lib/models/TechNews";

interface LeanVideo {
  _id: Types.ObjectId;
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: Date;
  duration: number;
  likedBy: Types.ObjectId[];
  dislikedBy: Types.ObjectId[];
  views: number;
  channelId: { name: string; logo: string };
}

interface LeanBlogPost {
  _id: Types.ObjectId;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  createdAt: Date;
  tags: string[];
  author: string;
  channelId: { name: string; logo: string };
  views: number;
  slug: string;
}

interface LeanTechNews {
  _id: Types.ObjectId;
  title: string;
  description: string;
  content: string;
  url: string;
  createdAt: Date;
  featuredImage: string;
  slug: string;
}

interface LeanPDF {
  _id: Types.ObjectId;
  title: string;
  previewUrl: string;
  imageUrl: string;
  author: string;
  dateUploaded: Date;
  channelName: string;
  channelLogo: string;
  channelId: Types.ObjectId;
  url: string;
  slug: string;
  featureImageUrl: string;
  createdAt: Date;
  contentType: string;
}

interface LeanUser {
  _id: Types.ObjectId;
  savedPosts: LeanBlogPost[];
  savedTechNews: LeanTechNews[];
  savedPDFs: LeanPDF[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id: userIdFromUrl } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== userIdFromUrl) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(userIdFromUrl)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const userId = new Types.ObjectId(userIdFromUrl);

    const likedVideos = await Video.find({ likedBy: userId })
      .populate("channelId", "name logo")
      .select("title description thumbnailUrl uploadDate duration likedBy dislikedBy _id views channelId")
      .lean<LeanVideo[]>();

    const dislikedVideos = await Video.find({ dislikedBy: userId })
      .populate("channelId", "name logo")
      .select("title description thumbnailUrl uploadDate duration likedBy dislikedBy _id views channelId")
      .lean<LeanVideo[]>();

    const likedBlogPosts = await BlogPost.find({ likeBy: userId })
      .populate("channelId", "name logo")
      .select("title content excerpt featuredImage createdAt tags author channelId views slug")
      .lean<LeanBlogPost[]>();

    const dislikedBlogPosts = await BlogPost.find({ dislikeBy: userId })
      .populate("channelId", "name logo")
      .select("title content excerpt featuredImage createdAt tags author channelId views slug")
      .lean<LeanBlogPost[]>();

    const user = await User.findById(userId)
      .populate([
        {
          path: "savedPosts",
          select: "title content excerpt featuredImage createdAt tags author channelId views slug",
          populate: {
            path: "channelId",
            select: "name logo",
          },
          model: BlogPost,
        },
        {
          path: "savedTechNews",
          select: "title description content url createdAt featuredImage slug",
          model: TechNews,
        },
        {
          path: "savedPDFs",
          select: "title previewUrl imageUrl author dateUploaded channelName channelLogo channelId url slug featureImageUrl createdAt contentType",
          model: PDFDocumentModel,
        },
      ])
      .lean<LeanUser>();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const liked = [
      ...likedVideos.map((item) => ({
        ...item,
        type: "video",
        thumbnailUrl: item.thumbnailUrl,
        uploadDate: item.uploadDate,
        _id: item._id,
        views: item.views,
        channel: item.channelId?.name || "Unknown Channel",
        channelLogo: item.channelId?.logo || "/placeholder.svg",
        videoSlug: item._id,
      })),
      ...likedBlogPosts.map((item) => ({
        ...item,
        type: "blogpost",
        thumbnailUrl: item.featuredImage || "/placeholder.svg",
        uploadDate: item.createdAt,
        _id: item._id,
        views: String(item.views),
        channel: item.channelId?.name || "Unknown Channel",
        channelLogo: item.channelId?.logo || "/placeholder.svg",
        slug: item.slug || item._id,
        videoSlug: item._id,
        content: item.content,
        excerpt: item.excerpt,
        title: item.title,
      })),
    ];

    const disliked = [
      ...dislikedVideos.map((item) => ({
        ...item,
        type: "video",
        thumbnailUrl: item.thumbnailUrl,
        uploadDate: item.uploadDate,
        _id: item._id,
        views: item.views,
        channel: item.channelId?.name || "Unknown Channel",
        channelLogo: item.channelId?.logo || "/placeholder.svg",
        videoSlug: item._id,
      })),
      ...dislikedBlogPosts.map((item) => ({
        ...item,
        type: "blogpost",
        thumbnailUrl: item.featuredImage || "/placeholder.svg",
        uploadDate: item.createdAt,
        _id: item._id,
        views: String(item.views),
        channel: item.channelId?.name || "Unknown Channel",
        channelLogo: item.channelId?.logo || "/placeholder.svg",
        slug: item.slug || item._id,
        videoSlug: item._id,
        content: item.content,
        excerpt: item.excerpt,
        title: item.title,
      })),
    ];

    const savedPosts = user.savedPosts.map((item: LeanBlogPost) => ({
      ...item,
      type: "blogpost",
      thumbnailUrl: item.featuredImage || "/placeholder.svg",
      uploadDate: item.createdAt,
      _id: item._id,
      views: String(item.views),
      channel: item.channelId?.name || item.author || "Unknown Channel",
      channelLogo: item.channelId?.logo || "/placeholder.svg",
      slug: item.slug || item._id,
      videoSlug: item._id,
    }));

    const savedTechNews = user.savedTechNews.map((item: LeanTechNews) => ({
      ...item,
      type: "technews",
      thumbnailUrl: item.featuredImage || "/technews_placeholder.png",
      uploadDate: item.createdAt,
      _id: item._id,
      channel: "Tech News",
      channelLogo: "/technews_logo.png",
      slug: item.slug,
      videoSlug: item._id,
      content: item.content,
      url: item.url,
      title: item.title,
      featuredImage: item.featuredImage,
    }));

    const savedPDFs = user.savedPDFs.map((item: LeanPDF) => ({
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
      featureImageUrl: item.featureImageUrl,
      contentType: item.contentType,
    }));

    const saved = [...savedPosts, ...savedTechNews, ...savedPDFs];

    return NextResponse.json({ liked, disliked, saved });
  } catch (error) {
    console.error("Error fetching user content:", error);
    return NextResponse.json({ error: "Failed to fetch user content" }, { status: 500 });
  }
}