import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TechNews from "@/lib/models/TechNews";

export async function GET() {
  try {
    await connectDB();
    const techNews = await TechNews.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(techNews);
  } catch (error: any) {
    console.error("Error fetching Tech News:", error);
    return NextResponse.json({ message: "Failed to fetch Tech News", error: error?.message }, { status: 500 });
  }
}