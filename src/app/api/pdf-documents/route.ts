// src/app/api/pdf-documents/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PDFModel from '@/lib/models/PDF';

interface Document {
  id: string;
  title: string;
  previewUrl: string;
  type: string;
  author: string;
  dateUploaded: string;
  imageUrl?: string;
  slug: string;
  channelId: string;
}

export async function GET() {
  try {
    await connectDB();
    const pdfs = await PDFModel.find({});
    const documents: Document[] = pdfs.map((pdf) => ({
      id: pdf._id.toString(),
      title: pdf.title,
      previewUrl: pdf.fileUrl,
      type: pdf.contentType.replace(/-/g, '').toLowerCase(),
      author: pdf.author || 'Unknown',
      dateUploaded: pdf.createdAt.toISOString().slice(0, 10),
      imageUrl: pdf.featureImageUrl,
      slug: pdf.slug,
      channelId: pdf.channelId,
    }));
    documents.sort((a, b) =>
      new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime()
    );
    return NextResponse.json(documents, { status: 200 });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
