//src\components\VideoList.tsx
import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Play, MoreHorizontal } from 'lucide-react';
import { Content } from '@/types/common'; // Import from common.ts


interface VideoCardProps {
    video: Content;
    onClick: (item: Content) => void;
    formatDuration: (seconds: number) => string;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, formatDuration }) => {
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
                 <Avatar className="w-8 h-8 mr-3">
                    <AvatarImage src={video.channelLogo || '/placeholder.svg'} alt="Channel Avatar" />
                    <AvatarFallback>{video.channel?.charAt(0) || 'U'}</AvatarFallback>
                 </Avatar>
                <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">{video.title}</h3>
                    <div className="flex items-center text-sm text-gray-800">
                        <span>{video.channel}</span>
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

interface VideoListProps {
    videos: Content[];
    onVideoClick: (item: Content) => void;
    formatDuration: (seconds: number) => string;
}

const VideoList: React.FC<VideoListProps> = ({ videos, onVideoClick, formatDuration }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
      {videos?.map((video) => (
        <VideoCard
          key={video._id}
          video={video}
          onClick={onVideoClick}
          formatDuration={formatDuration}
        />
      ))}
    </div>
  );
};

export default VideoList;