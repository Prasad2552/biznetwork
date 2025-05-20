// src/components/ShortCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card"

interface ShortCardProps {
    short: {
        _id: string;
        title: string;
        videoUrl: string;
        thumbnailUrl: string;
      uploadDate: Date;
        channelId: string;
        likes: number;
        views: number;
      channel: {
        name: string;
        logo: string;
      };
    };
}

const ShortCard: React.FC<ShortCardProps> = ({ short }) => {
    return (
        <Link href={`/shorts/${short._id}`} className="relative block">
            <Card className="shadow-md">
                <CardContent className="p-0">
                    <div className="relative aspect-video">
                        <Image
                            src={short.thumbnailUrl}
                            alt={short.title}
                            fill
                            className="object-cover transition-transform duration-200 hover:scale-105"
                        />
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-sm">{short.title}</h3>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ShortCard;