import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
interface PDFDocument {
    id: string;
    title: string;
    previewUrl: string;
    imageUrl?: string;
    type: string;
    author: string;
    dateUploaded: string;
    channelLogo?: string;
    channelName?: string;
    channelId: string;
    url: string;
    slug: string;
}
interface PDFCardProps {
    doc: PDFDocument;
}

export const PDFCard: React.FC<PDFCardProps> = ({ doc }) => {
    return (
        <Link href={`/documents/${doc.slug}`} key={doc.id}>
            <Card className="p-4 flex items-center space-x-4">
                <div className="w-14 h-14 relative">
                    <Image
                        src={doc.imageUrl?.replace(process.env.NEXT_PUBLIC_API_URL || "", '') || '/placeholder.svg'}
                        alt={doc.title}
                        fill
                        className="rounded object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <div className="w-3/4">
                    <h3 className="font-semibold text-sm line-clamp-2">{doc.title}</h3>
                    <p className="text-xs text-gray-600">{formatDistanceToNow(new Date(doc.dateUploaded))} ago</p>
                </div>
            </Card>
        </Link>
    );
};