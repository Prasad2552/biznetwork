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

export async function GET(request: Request) {
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

    const res = NextResponse.json(documents);
    res.headers.set('Access-Control-Allow-Origin', 'https://www.biznetworq.com');
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return res;
  } catch (error) {
    console.error('Error fetching documents:', error);
    const res = NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', 'https://www.biznetworq.com');
    return res;
  }
}
