//src\types\common.ts
import { Types } from 'mongoose';

export interface Video {
    _id: string;
    title: string;
    description?: string;
    filePath?: string;
    featureImageUrl?: string;
    author?: string;
    logo?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    views: number;
    likes: number;
    dislikes: number;
    channel: string;
    channelLogo: string;
    uploadDate: string;
    duration: string;
    commentCount: number;
    likedBy?: string[];
    dislikedBy?: string[];
    type: 'video' | 'webinar' | 'podcast' | 'testimonial' | 'demo' | 'event';
    subscriberCount?: number;
    watchedBy?: string[];
    comments?: any[];
    slug?: string;
    channelId: Types.ObjectId | string;
    categories?: { [category: string]: string[] };
    status?: 'draft' | 'published';
    eventImageUrls: string[];
}


export interface Content { // ADDED export keyword
    _id: string;
    title: string;
    description?: string;
    author?: string;
    logo?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    views?: number | string; // changed to optional
    likes?: number | string;  // changed to optional
    dislikes?: number | string;  // changed to optional
    channel?: string;
    channelLogo?: string;
    uploadDate?: string;
    duration?: string; // changed to optional
    commentCount?: number;  // changed to optional
    likedBy?: string[];
    dislikedBy?: string[];
    type: 'video' | 'webinar' | 'podcast' | 'testimonial' | 'demo' | 'ebook'| 'event' | 'blogpost' |'infographic'|'case-study'| 'white-paper' | 'technews' | 'pdf' | undefined; //ADD technews here
    subscriberCount?: number;
    watchedBy?: string[];
    comments?: any[];
    slug?: string;
    channelId?: Types.ObjectId | string;
    categories?: { [category: string]: string[] };
    status?: 'draft' | 'published';
    date?: string;
    time?: string;
    registrationLink?: string;
    audioUrl?: string;
    content?: string;
    pdfUrl?: string;
    createdAt?:string; // ADD this line. This is crucial
    tags?:string[]; // ADD this line. This is crucial
    excerpt?: string;  //Add this line this is crucial
    featureImageUrl?: string;
     url?: string; // added optional url as content can be a blog post not having URL
     previewUrl?: string;
     imageUrl?: string;
     dateUploaded?: string;
     contentType?: string;
}


export interface Channel {
    _id: string;
    name: string;
    logoUrl: string;
}



export interface Comment {
    _id: string;
    userId: string;
    username: string;
    content: string;
    likes: number;
    dislikes: number;
    createdAt: string;
    replies: Comment[];
    likedBy?: string[];
    dislikedBy?: string[];
}

export interface BlogPost {
    _id: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
    featureImageUrl?: string;
    channelId?: string;
    views: number | string;  // Updated to be number | string
    likes?: number | string;   // Updated to be number | string
    dislikes?: number | string;  // Updated to be number | string
    slug?: string;
    channelLogo?: string;
    channel?: string;      // Add channel
    logo?: string;         // Add logo
    description?: string;  // Add description
    type: 'blogpost';
    excerpt: string;
     tags: string[]; // Make tags required here if all blog post cards must have tags

}


export interface PDFDocument {
    _id: string;
    title: string;
    previewUrl: string;
    imageUrl?: string;
    type: 'pdf';
    author?: string;
    dateUploaded?: string;
    featureImageUrl?: string;
    channelLogo?: string;
    channelName?: string;
    channelId?: string;
    url?: string;
    slug?: string;
    createdAt?: string;
    contentType?: string;
}

export interface CaseStudy {
    _id: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    createdAt: string;
    tags: string[];
    featuredImage?: string;
    channelId?: string;
    isVerified?: boolean;
    views: string;
    slug?: string;
}

export interface TechNews {
    _id: string;
    title: string;
    content: string;
    featuredImage?: string;
    channelId: string;
    createdAt: string;
    slug:string;
    likes?: number;  
    dislikes?: number; 
    views?: number | string; 
    type: 'technews'; 
    url: string;
    channel:string;
    channelLogo:string;
    uploadDate:string;
     duration?: string;
    commentCount?: number;
    
}

export interface SearchResult {
    _id: string;
    title: string;
    type: 'video' | 'blog' | 'pdf';
    slug?: string;
  }