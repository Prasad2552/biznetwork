// src/app/api/tech-news/[slug]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TechNews from '@/lib/models/TechNews';  // Import the TechNews model

interface Params {
    slug?: string;
}

export async function GET(req: Request, { params }: { params: Params }) {
  try {
    await connectDB();
    const { slug } = await params;

    // Check if slug was provided
    if (!slug) {
      return new NextResponse(JSON.stringify({ message: "Tech News slug is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    
    const techNews = await TechNews.findOne({slug: slug});

    if (!techNews) {
      return new NextResponse(JSON.stringify({ message: "Tech News not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    return NextResponse.json(techNews);
  } catch (error:any) {
    console.error('Error fetching Tech News:', error);
    return NextResponse.json({ message: 'Failed to fetch Tech News', error: error?.message }, { status: 500 });
  }
}