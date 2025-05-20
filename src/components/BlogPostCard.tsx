// src/components/BlogPostCard.tsx
"use client"
import React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from 'lucide-react';
import { useChannelFollow } from "@/hooks/useChannelFollow";
import { useSession } from "next-auth/react"
import { useAuthContext } from "@/contexts/auth-context";
import { Button } from '@/components/ui/button'; // Import Button\



interface BlogPost {
    _id: string;
    title: string;
    excerpt: string;
    content: string;
    author?: string;
    createdAt: string;
    tags: string[];
    featuredImage?: string;
    channelId?: string;
    channelLogo?: string;
    isVerified?: boolean;
    views: number | string;
    slug?: string;
    orientation?: 'horizontal' | 'vertical';
    channel?: string;
    logo?: string;
    channelName?: string; //Channel Name
}

interface BlogPostCardProps {
    post: BlogPost;
    handleSelectedVideoSubscriberCountChange: (count: number, channelId: string) => void; // Updated prop type
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, handleSelectedVideoSubscriberCountChange }) => {
    const aspectRatio = post.orientation === 'vertical' ? 'aspect-[3/4]' : 'aspect-video';
    const { data: session } = useSession();
    const { openSignInModal } = useAuthContext()
    const [channelLogo, setChannelLogo] = useState(post.channelLogo || "/placeholder.svg");
    const [channelName, setChannelName] = useState(post.channelName || "Unknown Channel");
    const [views, setViews] = useState(post.views || "0");

    const { isFollowing, toggleFollow, isLoading, followerCount } = useChannelFollow(post.channelId || ""); // Add useChannelFollow hook


    useEffect(() => {
        setChannelLogo(post.channelLogo || "/placeholder.svg");
        setChannelName(post.channelName || "Unknown Channel");
        setViews(post.views); // No default value needed here, handle the display conditionally
    }, [post.channelLogo, post.channelName, post.views]);

    useEffect(() => {
        if (followerCount !== undefined && post.channelId) {
            handleSelectedVideoSubscriberCountChange(followerCount, post.channelId);
        }
    }, [followerCount, post.channelId, handleSelectedVideoSubscriberCountChange]);

    const handleSubscribe = async () => {
        if (!session?.user) {
            openSignInModal();
            return;
        }
        try {
            await toggleFollow();
        } catch (error) {
            // Handle error (e.g., display a toast message)
            console.error("Error subscribing/unsubscribing:", error);
        }
    };


    return (
        <Card className="cursor-pointer rounded-xl border-none shadow-none">
            <Link href={`/blog/posts/${post.slug}`} key={`blog-link-${post._id}`}>
                <div className={`${aspectRatio} relative overflow-hidden`}>
                    <Image
                        src={post.featuredImage || '/placeholder.svg'}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover rounded-xl"
                        style={{ objectFit: 'cover' }}
                    />
                </div>

            </Link>


            <div className="p-4">
                <h2 className="text-base font-semibold mb-2 truncate text-[#323232]">
                    <Link href={`/blog/posts/${post.slug}`} >
                        {post.title}
                    </Link>
                </h2>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">

                        <Link href={`/@${post.channelName}`} key={`channel-link-${post.channelName}`}>
                            <Image
                                src={channelLogo}
                                alt={`${channelName || "Channel"} Logo`}
                                width={30}
                                height={30}
                                className="rounded-full"
                                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                                style={{ objectFit: "cover" }}
                            />
                        </Link>

                        <div>
                            <span className="font-semibold text-sm text-[#323232] truncate">

                                {channelName}

                                <CheckCircle2
                                    className="h-4 w-4 ml-1 inline text-blue-500"
                                    style={{ fill: 'white', stroke: 'currentColor' }}
                                />

                            </span>

                            <p className="text-sm text-[#606060]">
                                {typeof views === 'number' ? (views as number).toLocaleString() : views} views
                            </p>
                        </div>
                    </div>
                    {/*Added button and remove subscribe button component*/}
                    <Button
                        variant="default"
                        onClick={handleSubscribe}
                        className="bg-[#2A2FB8] hover:bg-[#3730a3] rounded-full text-white text-sm px-4 py-1 h-8"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : isFollowing ? "Unfollow" : `Follow`}
                    </Button>

                </div>
                <p className="text-gray-600 mt-4">{post.excerpt}</p>

                <div className="flex justify-end mt-4">
                    <div className="flex gap-2">
                        {post.tags && post.tags.length > 0 ? (
                            post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 bg-gray-100 text-[#606060] text-xs rounded-full"
                                >
                                    {tag}
                                </span>
                            ))
                        ) : (
                            null
                        )}
                    </div>
                </div>
            </div>

        </Card>

    );
};