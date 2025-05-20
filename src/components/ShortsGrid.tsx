// src/components/ShortsGrid.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useChannelFollow } from "@/hooks/useChannelFollow"; // Import the hook

interface Short {
    _id: string;
    title: string;
    videoUrl: string;
    channelId: string;
    channel: {
        name: string;
        logo: string;
    };
    views: number;
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
    thumbnailUrl: string; // Add this field
}

interface ShortsGridProps {
    shorts: Short[];
}

const ShortsGrid: React.FC<ShortsGridProps> = ({ shorts }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shorts.map((short) => {
                const { isFollowing, toggleFollow, isLoading: isFollowLoading } = useChannelFollow(short.channelId); // Use the hook
                return (
                    <div
                        key={short._id}
                        className="rounded-xl overflow-hidden shadow-none relative transition-transform transform hover:scale-105"
                        style={{ backgroundColor: "rgba(225, 225, 225, 0.3)" }}
                    >
                        <div className="relative w-full rounded-lg text h-[300px]">
                            <Link href={`/short/${short._id}`} className="contents">
                                <div className="relative w-full h-[300px] p-2 rounded-lg overflow-hidden">
                                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                                        <Image
                                            src={short.thumbnailUrl || "/uploads/placeholder.svg"}
                                            alt={short.title}
                                            fill
                                            className="object-cover w-full h-full cursor-pointer"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            style={{ objectFit: "cover" }}
                                            loading="lazy"
                                        />
                                    </div>
                                </div>

                            </Link>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Button variant="ghost" size="icon" className="rounded-full bg-white/80 hover:bg-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5.14V19.14L19 12.14L8 5.14Z"></path>
                                    </svg>
                                </Button>
                            </div>
                        </div>

                        <div className="p-2">
                            <div className="flex items-center space-x-2  text-xs text-gray-500">
                                <div className="relative w-6 h-6 flex items-center justify-center">
                                    <Image
                                        src={short.channel.logo || "/uploads/placeholder.svg"}
                                        alt={short.channel.name}
                                        fill
                                        className="object-cover mt-2 rounded-full"
                                        sizes="100%"
                                        loading="lazy"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <Link href={`/@${short.channel.name}`} className="text-xs truncate font-semibold text-gray-800 flex items-center">
                                    {short.channel.name.split(" ").slice(0, 2).join(" ")} {/* Truncate to first 2 words */}
                                    <CheckCircle className="h-3 w-3 inline-block ml-1 text-blue-500" />
                                </Link>

                            </div>
                            <p className="text-xs ml-8 text-gray-600">{short.views.toLocaleString()} views</p>

                            <Button
                                variant="default"
                                size="sm"
                                className="absolute bottom-2 right-2 bg-[#2A2FB8] text-white hover:bg-blue-700 rounded-full text-xs font-medium"
                                onClick={toggleFollow}
                                disabled={isFollowLoading} // Disable while loading
                            >
                                {isFollowLoading ? "Following..." : (isFollowing ? "Unfollow" : "Follow")}
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default ShortsGrid;