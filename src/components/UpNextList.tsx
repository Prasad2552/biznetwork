import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Video } from '@/types/common';

interface UpNextListProps {
  videos: Video[];
  onVideoClick: (item: Video) => void;
  formatDuration: (seconds: number) => string;
}

const UpNextList: React.FC<UpNextListProps> = ({ videos, onVideoClick }) => {
  return (
    <div className="space-y-4 w-full overflow-hidden">
      {videos?.map((video) => (
        <div
          key={video._id}
          className="flex w-full max-w-full space-x-3 cursor-pointer"
          onClick={() => onVideoClick(video)}
        >
          {/* Thumbnail */}
          <div className="w-32 h-20 relative flex-shrink-0 rounded overflow-hidden">
            <Image
              src={video.thumbnailUrl || '/placeholder.svg'}
              alt="Thumbnail"
              width={128}
              height={80}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Video Info */}
          <div className="flex flex-col justify-between flex-1 overflow-hidden">
            <span className="font-semibold text-sm line-clamp-2">{video.title}</span>
            <div className="flex items-center text-[10px] text-gray-500 truncate">
              <p className="truncate">{video.channel}</p>
              <img
                src="/uploads/verified1.png"
                alt="verified"
                className="h-3 w-3 ml-1"
              />
            </div>
            <p className="text-[10px] text-gray-500 truncate">
              {video.views} views • {formatDistanceToNow(new Date(video.uploadDate))} ago
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpNextList;
export { UpNextList };
