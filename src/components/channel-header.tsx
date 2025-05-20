'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import  SubscribeButton  from '@/components/subscribe-button';
import { CheckCircle2 } from 'lucide-react';

interface ChannelHeaderProps {
  channelId: string;
  name: string;
  logoUrl: string;
  subscriberCount: number;
  isVerified?: boolean;
}

export function ChannelHeader({
  channelId,
  name,
  logoUrl,
  subscriberCount,
  isVerified = false
}: ChannelHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={logoUrl} alt={name} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">{name}</h2>
            {isVerified && (
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">{subscriberCount.toLocaleString()} subscribers</p>
        </div>
      </div>
      <SubscribeButton channelId={channelId} />
    </div>
  );
}

