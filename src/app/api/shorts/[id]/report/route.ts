// src/app/api/shorts/[id]/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Short from '@/lib/models/Short'; // Import your Short model

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();

        const { id: shortId } = params;
        const requestBody = await req.json();
        const { reportReason, userId } = requestBody;

        // Verify Data!
        if (!shortId || !reportReason || !userId) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Verify Short by ID
        const short = await Short.findById(shortId);
        if (!short) {
            return NextResponse.json({ message: "Short not found" }, { status: 404 });
        }

        // TODO: Here, implement a function to add to database report.
        return NextResponse.json({ message: "Short reported successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Error reporting short:", error);
        return NextResponse.json({ message: "Error reporting short.", error: error.message }, { status: 500 });
    }
}