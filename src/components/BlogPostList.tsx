import React from 'react';
import { BlogPost } from '@/types/common';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface BlogPostListProps {
    blogPosts: BlogPost[];
    
}

const BlogPostList: React.FC<BlogPostListProps> = ({ blogPosts }) => {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blogPosts.map((post) => (
                <Card key={post._id} className="cursor-pointer hover:shadow-md transition-shadow border-none mt-6 bg-gray-50">
                    <Link
                        href={`/blog/posts/${post.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <CardContent className="p-4">
                            <div className="relative h-32 mb-2">
                                <Image
                                    src={post.featureImageUrl || '/uploads/biznetwork.png'}
                                    alt={post.title}
                                    fill
                                    className="object-cover rounded-lg"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{post.title}</h3>
                            <div className="flex items-center mb-1">
                                <Image
                                    src={post.channelLogo || '/uploads/biznetwork.png'}
                                    alt={`${post.channel}`}
                                    width={20}
                                    height={20}
                                    className="rounded-full mr-1"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    style={{ objectFit: 'cover' }}
                                />
                                <span className="font-semibold text-sm mr-1">{post.author}</span>
                                <CheckCircle size={14} className="text-blue-600" />
                            </div>
                            <div className="flex items-center ml-6 text-xs text-gray-500">
                                <span>{post.views} views</span>
                            </div>
                        </CardContent>
                    </Link>
                </Card>
            ))}
        </div>
    );
};

export default BlogPostList;