// src\types\content.ts
import { Document, Types } from 'mongoose';

// Base interface for all content types
export interface BaseContent extends Document {
  channelId: Types.ObjectId;
  title: string;
  description?: string;
  status: 'draft' | 'published';
  filePath?: string; // Add file path here
  featureImageUrl?: string; // Add feature image path
   contentType?: string; // Add content type here
  createdAt: Date;
  type?: string; 
  updatedAt: Date;
  author?: string;
  views?: number;
  tags?: string[];
  duration?: number;
  content?: string; // Add content
  featuredImage?:string;
  slug?:string;
  extractionStatus?:string;
}

// Response interface for the API
export interface ContentResponse {
  _id?: string;
  title?: string;
  type?: ContentType | 'pdfs';
  status?: string;
  createdAt?: string;
  description?: string;
}

// Map of content types to their model names
export const ContentTypeMap = {
  videos: 'Video',
  blogs: 'Blog',
  webinars: 'Webinar',
  podcasts: 'Podcast',
  caseStudies: 'CaseStudy',
  infographics: 'Infographic',
  whitePapers: 'WhitePaper',
  testimonials: 'Testimonial',
  ebooks: 'Ebook',
  demos: 'Demo',
  events: 'Event',
  pdfs: 'PDF'
} as const;



export type ContentType = keyof typeof ContentTypeMap;