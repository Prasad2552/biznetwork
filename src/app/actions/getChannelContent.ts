// src/app/actions/getChannelContent.ts
"use server";

import { MongoClient, ObjectId } from "mongodb";
import type { Content } from "@/types/common";

// Define a type for channel data
interface ChannelData {
    _id: ObjectId;
    name: string;
    logo: string;
    // Add other channel properties as needed
}

async function getChannelData(db: any, channelId: string): Promise<ChannelData | null> {
    try {
        const channel = await db.collection("channels").findOne({ _id: new ObjectId(channelId) });
        return channel as ChannelData || null;
    } catch (error) {
        console.error("Error fetching channel data:", error);
        return null;
    }
}

export async function getChannelContent(channelId: string, type?: string): Promise<Content[]> {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI as string);
        const db = client.db("biznetwork");

        let contents: any[] = [];

        // Helper function to fetch content based on type
        const fetchContent = async (collectionName: string, query: any) => {
            console.log(`Querying ${collectionName} collection with query:`, query);
            const results = await db.collection(collectionName)
                .find(query)
                .sort({ uploadDate: -1, createdAt: -1, dateUploaded: -1 }) // Add other sorting options
                .limit(30)
                .toArray();
            console.log(`Number of ${collectionName} found:`, results.length);
            return results;
        };

        // 1. Handle "videos" collection
        if (["Videos", "Webinars", "Podcasts", "Testimonials", "Demos", "Events"].includes(type || "")) {
            const contentTypeMap: { [key: string]: string } = {
                "Videos": "video",
                "Webinars": "webinar",
                "Podcasts": "podcast",
                "Testimonials": "testimonial",
                "Demos": "demo",
                "Events": "event",
            };

            const contentType = contentTypeMap[type as keyof typeof contentTypeMap];
            const videoQuery = { channelId: new ObjectId(channelId), type: contentType };
            const videoContents = await fetchContent("videos", videoQuery);
            contents = contents.concat(videoContents);
        }

        // 2. Handle "pdfs" collection
        if (["Case Studies", "Info-graphics", "White-papers", "Testimonials", "E-books"].includes(type || "")) {
            const contentTypeMap: { [key: string]: string } = {
                "Case Studies": "case-study",
                "Info-graphics": "infographic",
                "White-papers": "white-paper",
                "Testimonials": "testimonial",
                "E-books": "ebook",
            };

            const contentType = contentTypeMap[type as keyof typeof contentTypeMap];
            const pdfQuery = { channelId: new ObjectId(channelId), contentType };
            const pdfContents = await fetchContent("pdfs", pdfQuery);
            contents = contents.concat(pdfContents);
        }

        // 3. Handle "blogposts" collection
        if (type === "Blogs") {
            const blogQuery = { channelId: channelId };
            const blogContents = await fetchContent("blogposts", blogQuery);
            contents = contents.concat(blogContents);
        }

        // 4. Handle "All" - Combine all collections
        if (type === "All") {
            // Query videos
            const videoQuery = { channelId: new ObjectId(channelId) };
            const videoContents = await fetchContent("videos", videoQuery);
            contents = contents.concat(videoContents);

            // Query pdfs
            const pdfQuery = { channelId: new ObjectId(channelId) };
            const pdfContents = await fetchContent("pdfs", pdfQuery);
            contents = contents.concat(pdfContents);

            // Query blogposts
            const blogQuery = { channelId: channelId };
            const blogContents = await fetchContent("blogposts", blogQuery);
            contents = contents.concat(blogContents);
        }

        await client.close();

        const serializedContents: Content[] = (await Promise.all(contents.map(async content => {
            const channelData = await getChannelData(db, content.channelId)

            let contentType = content.contentType || content.type || "blogpost";

            switch (contentType) {

                case "video":
                case "webinar":
                case "podcast":
                case "testimonial":
                case "demo":
                case "event":

                    return {

                        _id: content._id.toString(),
                        title: content.title || "",
                        description: content.description || "",
                        author: channelData?.name || "",
                        logo: channelData?.logo || "",
                        videoUrl: content.videoUrl || "",
                        thumbnailUrl: content.thumbnailUrl || "",
                        views: content.views || 0,
                        likes: content.likes || 0,
                        dislikes: content.dislikes || 0,
                        channel: channelData?.name || "",
                        channelLogo: channelData?.logo || "",
                        uploadDate: content.uploadDate ? new Date(content.uploadDate).toISOString() : new Date().toISOString(),
                        duration: content.duration || "0:00",
                        commentCount: content.commentCount || 0,
                        likedBy: content.likedBy || [],
                        dislikedBy: content.dislikedBy || [],
                        type: contentType as Content["type"],
                        subscriberCount: content.subscriberCount || 0,
                        watchedBy: content.watchedBy || [],
                        comments: content.comments || [],
                        slug: content.slug || "",
                        channelId: (content.channelId as any)?.toString() || "",
                        categories: content.categories || {},
                        status: content.status || "published",
                        date: content.date || "",
                        time: content.time || "",
                        registrationLink: content.registrationLink || "",
                        audioUrl: content.audioUrl || "",
                        content: content.content || "",
                        pdfUrl: content.pdfUrl || "",
                        createdAt: content.createdAt ? new Date(content.createdAt).toISOString() : new Date().toISOString(),
                        tags: content.tags || [],
                        excerpt: content.excerpt || "",
                        featuredImage: content.featuredImage || ""
                    };
                    break;

                case "case-study":
                case "infographic":
                case "white-paper":
                case "ebook":

                    return {
                        _id: content._id.toString(),
                        title: content.title || "",
                        description: content.description || "",
                        author: channelData?.name || "",
                        logo: channelData?.logo || "",
                        thumbnailUrl: content.previewUrl || content.imageUrl || "", // Use previewUrl or imageUrl
                        channel: channelData?.name || "",
                        channelLogo: channelData?.logo || "",
                        uploadDate: content.dateUploaded ? new Date(content.dateUploaded).toISOString() : new Date().toISOString(),
                        type: contentType as Content["type"],
                        slug: content.slug || "",
                        channelId: (content.channelId as any)?.toString() || "",
                        status: "published", // Assuming all are published
                        pdfUrl: content.url || "", // URL to the PDF
                        excerpt: content.excerpt || "", // Assuming there is an excerpt
                    };
                    break;

                case "blogpost":

                    return {
                        _id: content._id.toString(),
                        title: content.title || "",
                        description: content.description || "",
                        author: channelData?.name || "",
                        channel: channelData?.name || "",
                        channelLogo: channelData?.logo || "",
                        uploadDate: content.createdAt ? new Date(content.createdAt).toISOString() : new Date().toISOString(),
                        type: contentType as Content["type"],
                        slug: content.slug || "",
                        channelId: content.channelId || "",
                        status: content.status || "published",
                        content: content.content || "",
                        excerpt: content.excerpt || "",
                        featuredImage: content.featuredImage || ""

                    }
                    break;

                default:
                    return null; // Skip unknown types
            }
        })).then(resolvedContents => resolvedContents.filter(content => content !== null) as Content[])); // Filter out null values and cast to Content[]

        console.log("Number of contents found:", contents.length); // Debugging
        return serializedContents;
    } catch (error) {
        console.error("Error fetching channel content:", error);
        return [];
    }
}