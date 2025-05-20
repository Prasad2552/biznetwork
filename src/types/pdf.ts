//src\types\pdf.ts
export interface PDFDocument {
  id: string;
  title: string;
  previewUrl: string;
  imageUrl?: string;
  type: string;
  createdAt:string;
  channelLogo?: string;
  channelName?: string;
  channelId: string;
  slug: string;
 content?: string;
 featureImageUrl?:string;
}