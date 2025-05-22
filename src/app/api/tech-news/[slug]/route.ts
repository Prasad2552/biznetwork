import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import TechNews from "@/lib/models/TechNews";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ message: "Tech News slug is required" }, { status: 400 });
    }

    const techNews = await TechNews.findOne({ slug }).lean();

    if (!techNews) {
      return NextResponse.json({ message: "Tech News not found" }, { status: 404 });
    }

    return NextResponse.json(techNews);
  } catch (error: any) {
    console.error("Error fetching Tech News:", error);
    return NextResponse.json({ message: "Failed to fetch Tech News", error: error?.message }, { status: 500 });
  }
}