// src\app\api\documents\[slug]\route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PDFModel from '@/lib/models/PDF';
import Channel from '@/lib/models/Channel';
import { PDFDocument } from '@/types/pdf';


export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        await connectDB();
        const { slug } = await params;

        if (!slug) {
            return NextResponse.json({ error: 'Slug parameter is missing' }, { status: 400 });
        }

        const pdf = await PDFModel.findOne({ slug });

        if (!pdf) {
            return NextResponse.json({ error: 'PDF document not found' }, { status: 404 });
        }

        // Fetch channel data
        const channel = await Channel.findById(pdf.channelId);

        const response: PDFDocument = {
            id: pdf._id.toString(),
            title: pdf.title,
            previewUrl: pdf.fileUrl,
            type: pdf.contentType.replace(/-/g, ' '),
            createdAt: pdf.createdAt ? pdf.createdAt.toISOString().slice(0, 10) : 'Unknown Date',
             imageUrl: pdf.featureImageUrl,
              channelLogo: channel?.logo || '/placeholder.svg',
             channelName: channel?.name || "Unknown Channel",
             channelId: String(pdf.channelId),
            slug: pdf.slug,
           content: pdf.content // Using content from db, no need for fetch logic
        };
        console.log("API Response (before return):", response);
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching PDF document:', error);
        return NextResponse.json({ error: 'Failed to fetch PDF document' }, { status: 500 });
    }
}