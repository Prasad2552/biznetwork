import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | undefined;
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get("type");

    console.log("Searching for content with id or slug:", id, "and type:", type);

    client = await MongoClient.connect(process.env.MONGODB_URI || "");
    const db = client.db("biznetwork");
    const collection = db.collection("videos");
    const channelCollection = db.collection("channels");

    let post;

    if (ObjectId.isValid(id)) {
      post = await collection.findOne({ _id: new ObjectId(id) });
    } else {
      post = await collection.findOne({ slug: id });
    }

    if (!post) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    await collection.updateOne({ _id: post._id }, { $inc: { views: 1 } });
    post = await collection.findOne({ _id: post._id });

    let channel;
    if (post?.channelId) {
      try {
        channel = await channelCollection.findOne({
          _id: typeof post.channelId === "string" ? new ObjectId(post.channelId) : post.channelId,
        });
      } catch (error) {
        console.error(`Error fetching channel information for channelId ${post.channelId}`, error);
        channel = null;
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const channelLogo = channel?.logo ? `${channel.logo}` : "/placeholder.svg";
    const featuredImage = post?.thumbnailUrl || post?.featureImageUrl ? `${post.thumbnailUrl || post.featureImageUrl}` : "/placeholder.svg";

    const response = {
      _id: post?._id.toString(),
      title: post?.title || "Untitled",
      description: post?.description || "",
      videoUrl: post?.videoUrl || post?.filePath || "",
      thumbnailUrl: featuredImage,
      views: post?.views?.toString() || "0",
      slug: post?.slug || (post?.title ? post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "unknown"),
      likes: post?.likes,
      dislikes: post?.dislikes,
      channel: channel?.name,
      channelLogo,
      type: post?.type,
      eventImageUrls: post?.eventImageUrls,
      commentCount: post?.comments?.length || 0,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching content post:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}