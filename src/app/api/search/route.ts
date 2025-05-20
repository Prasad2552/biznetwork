import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/lib/models/Video';
import BlogPost from '@/lib/models/Blog';
import PDFDocument from '@/lib/models/PDF'; // Assuming you have a PDFDocument model
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const searchTerm = req.nextUrl.searchParams.get('q') || '';

        if (!searchTerm) {
            return NextResponse.json({ results: [] }, { status: 200 });
        }

     

   
        const regex = new RegExp(searchTerm, 'i');
        const [videos, blogPosts, pdfs] = await Promise.all([
              Video.find({ title: { $regex: regex } }).limit(5).lean().catch(err => {
                console.error("Error during video search:", err);
                return [];
            }),
             BlogPost.find({ title: { $regex: regex } }).limit(5).lean().catch(err => {
                console.error("Error during blog post search:", err);
                return [];
            }),
            PDFDocument.find({ title: { $regex: regex } }).limit(5).lean().catch(err => {
                console.error("Error during pdf document search:", err);
                return [];
            })
        ]);

        const results = [
            ...videos.map(video => ({ ...video, type: 'video', slug: video.slug })),
            ...blogPosts.map(post => ({ ...post, type: 'blog', slug: post.slug })),
            ...pdfs.map(pdf => ({ ...pdf, type: 'pdf', slug: pdf.slug }))
        ];

        return NextResponse.json({ results }, { status: 200 });

    } catch (error) {
        console.error("Error during search:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}