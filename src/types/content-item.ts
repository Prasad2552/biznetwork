// src/types/content-item.ts

export interface ContentItem {
  _id: string; // Unique identifier for the content item
  title: string; // Title of the content item
  description: string; // Description of the content item
  thumbnailUrl?: string; // URL for the thumbnail image (optional, defaults to '/placeholder.svg')
  type: string; // Type of content (e.g., "video", "podcast", "webinar")
  uploadDate: string | Date; // Date the content was uploaded (can be string or Date object)
}