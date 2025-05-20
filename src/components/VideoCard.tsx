// src\components\VideoCard.tsx
import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Play, MoreHorizontal } from 'lucide-react';
import { Content } from '@/types/common'; // Import from common.ts
import Link from 'next/link'; // Import Link

interface VideoCardProps {
    video: Content;
    onClick: (item: Content) => void;
    formatDuration: (seconds: number) => string;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, formatDuration }) => {
    //Function from stack overflow to create a slug if the channel name is undefined
       function slugify(str: string) {
         if (!str) return ''; // Handle undefined or null input

         str = str.replace(/^\s+|\s+$/g, ''); // trim
         str = str.toLowerCase();

         // remove accents, swap symbols for space
         const from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
         const to   = "aaaaeeeeiiiiooooouuuunc------";
         for (let i=0, l=from.length ; i<l ; i++) {
             str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
         }

         str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
             .replace(/\s+/g, '-') // collapse whitespace and replace by -
             .replace(/-+/g, '-'); // collapse dashes

         return str;
     }

    const channelSlug = video.channel ? slugify(video.channel) : '';

    return (
        <div
            key={video._id}
            className="relative group cursor-pointer"
            onClick={() => onClick(video)}
        >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200">
                <Image
                    src={video.thumbnailUrl || '/placeholder.svg'}
                    alt="Video thumbnail"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(Number(video.duration))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                        <Play className="w-6 h-6 text-gray-900" />
                    </div>
                </div>
            </div>
            <div className="mt-3 flex items-center"> {/* Added items-center here */}
                <Link href={`/channels/@${channelSlug}`} className="cursor-pointer">
                    <Avatar className="w-8 h-8 mr-3">
                        <AvatarImage src={video.channelLogo || '/placeholder.svg'} alt="Channel Avatar" />
                        <AvatarFallback>{video.channel?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">{video.title}</h3>
                    <div className="flex items-center text-sm text-gray-800">
                        <Link href={`/channels/@${channelSlug}`} className="cursor-pointer">
                            <span>{video.channel}</span>
                        </Link>
                        <img src='uploads/right.png' alt="verified channel" className='h-3 w-3 ml-2' />
                    </div>
                    <span className='text-sm text-gray-500 mt-1' >{video.views} views</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default VideoCard;