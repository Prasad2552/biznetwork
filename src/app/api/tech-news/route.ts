// src/app/api/tech-news/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TechNews from '@/lib/models/TechNews';  // Import the TechNews model

export async function GET() {
  try {
    await connectDB();
    const techNews = await TechNews.find({}).sort({ createdAt: -1 }); // Fetch all TechNews, sorted by createdAt

    return NextResponse.json(techNews);
  } catch (error:any) {
    console.error('Error fetching Tech News:', error);
    return NextResponse.json({ message: 'Failed to fetch Tech News', error: error?.message }, { status: 500 });
  }
}