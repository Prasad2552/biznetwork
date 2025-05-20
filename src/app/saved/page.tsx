"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import { ToastContainer } from "react-toastify"
import { useContent } from "@/hooks/use-content"
import type { Video, BlogPost, PDFDocument, Content, TechNews } from "@/types/common"
import Sidebar from '@/components/sidebar';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Menu,
    Search,
    Mic,
    UserPlus,
    Bell,
} from "lucide-react";
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BlogPostCard } from "@/components/BlogPostCard";
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { format } from 'date-fns';
import { getChannelNameById } from "@/app/actions/getChannelNameById";

type ContentType = Video | BlogPost | PDFDocument | TechNews

export default function Saved() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { savedContent, removeSaved, isLoading } = useContent();
    const savedTechNews = savedContent.filter((item): item is TechNews => item.type === "technews");
    const { token, isUserLoggedIn, isAdmin, handleLogout } = useAuthCheck();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSidebarItem, setActiveSidebarItem] = useState('Saved');
    const [updatedBlogPosts, setUpdatedBlogPosts] = useState<BlogPost[]>([]);
    const [activeNavItem, setActiveNavItem] = useState<string>('All');

    //Memoize savedBlogPosts
    const savedBlogPosts = useMemo(() =>
        savedContent.filter((item): item is BlogPost => item.type === "blogpost"),
        [savedContent]
    );

    //Memoize savedPdfs
    const savedPDFs = useMemo(() =>
        savedContent.filter((item): item is PDFDocument => item.type === "pdf"),
        [savedContent]
    );

    useEffect(() => {
        const fetchChannelInfo = async () => {
            const updatedPosts = await Promise.all(
                savedBlogPosts.map(async (post) => {
                    const channelInfo = await getChannelNameById(post.channelId || '');
                    return {
                        ...post,
                        channelName: channelInfo?.name || 'Unknown Channel',
                        channelLogo: channelInfo?.logo || '/uploads/placeholder.svg',
                    };
                })
            );
            setUpdatedBlogPosts(updatedPosts);
        };

        if (savedBlogPosts.length > 0) {
            fetchChannelInfo();
        }
    }, [savedBlogPosts]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    if (status === "unauthenticated") {
        redirect("/signin");
    }

    const handleRemove = async (id: string) => {
        await removeSaved(id);
    };

    const handleContentClick = async (item: Content) => {
        if (!item?.type) {
            console.error("Content type not found:", item);
            return;
        }

        switch (item.type) {
            case "blogpost":
                const blogPost = item as BlogPost;
                router.push(`/blog/posts/${blogPost.slug}`);
                break;
            case "pdf":
                const pdf = item as PDFDocument;
                router.push(`/documents/${pdf.slug}`);
                break;
            default:
                console.error("Unknown content type:", item.type);
        }
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const handleDashboardRedirect = () => {
        if (isAdmin) {
            router.push('/admin/channels');
        } else {
            router.push('/dashboard');
        }
    }

    const renderSavedContent = () => {
        if (isLoading) {
            return <div>Loading saved content...</div>;
        }

        if (savedBlogPosts.length === 0 && savedTechNews.length === 0 && savedPDFs.length === 0) {
            return <div>No saved content yet.</div>;
        }

        // Function to filter PDFs based on activeNavItem
        const filteredPDFs = activeNavItem === 'All' ? savedPDFs : savedPDFs.filter(pdf => pdf.contentType === 'e-book');
        //or you may want to put it like this
        // const filteredPDFs = activeNavItem === 'All' ? savedPDFs : savedPDFs.filter(pdf => pdf.contentType === activeNavItem.toLowerCase().replace("-", ""));

        //Filter Blog Posts based on activeNavItem
        const filteredBlogPosts = activeNavItem === 'All' ? updatedBlogPosts : (activeNavItem === 'Blogs' ? updatedBlogPosts : []);

        // Filter Tech News based on activeNavItem
        const filteredTechNews = activeNavItem === 'All' ? savedTechNews : [];

        return (
            <>
                {filteredBlogPosts.length > 0 && (
                    <>
                        <h3 className="text-xl font-semibold mb-2"> Blog Posts</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {filteredBlogPosts.map((post) => (
                                <BlogPostCard
                                    key={post._id}
                                    post={post}
                                    handleSelectedVideoSubscriberCountChange={() => { }}
                                />
                            ))}
                        </div>
                    </>
                )}

                {filteredTechNews.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mt-8 mb-2"> Tech News</h2>
                        {filteredTechNews && filteredTechNews.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                                {filteredTechNews.map((newsItem) => (
                                    <Link key={newsItem._id} href={`/tech-news/${newsItem.slug}`}>
                                        <Card className="cursor-pointer hover:shadow-md transition-shadow border-none mt-2 bg-gray-50">
                                            <CardContent className="p-2 flex items-center space-x-4">
                                                <Image
                                                    src={newsItem.featuredImage ? newsItem.featuredImage : "/placeholder.svg"}
                                                    alt={newsItem.title}
                                                    width={80}
                                                    height={80}
                                                    className="rounded w-[80px] h-auto object-cover"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    loading='lazy'
                                                />
                                                <div className="w-3/4 font-normal text-xs text-gray-600">
                                                    {format(new Date(newsItem.createdAt), ' dd MMMM yyyy')}
                                                <h3 className="font-semibold text-xs truncate text-black line-clamp-2">
                                                        {newsItem.title}
                                                    </h3>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div>No Tech News Available.</div>
                        )}
                    </div>
                )}

            {/* Render PDFs, filtering by ContentType */}
            {filteredPDFs.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mt-8 mb-2">
                    {activeNavItem === 'All' ? 'Saved PDFs' : `Saved ${activeNavItem}`}

                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredPDFs.map((pdf) => (
                            <Card
                                key={pdf._id}
                                className="cursor-pointer hover:shadow-md transition-shadow border-none mt-2 bg-gray-50"
                                onClick={() => handleContentClick(pdf)}
                            >
                                <CardContent className="p-2 flex items-center space-x-4">
                                    <Image
                                        src={pdf.featureImageUrl ? pdf.featureImageUrl : "/placeholder.svg"}
                                        alt={pdf.title}
                                        width={80}
                                        height={80}
                                        className="rounded w-[80px] h-auto object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        loading='lazy'
                                    />
                                    <div className="w-3/4 font-normal text-xs text-gray-600">
                                        {pdf.createdAt ? (
                                            (() => {
                                                try {
                                                    const date = new Date(pdf.createdAt);
                                                    console.log("Date object:", date);
                                                    console.log("Formatted date:", format(date, ' dd MMMM yyyy'));
                                                    return format(date, ' dd MMMM yyyy');
                                                } catch (error) {
                                                    console.error("Error formatting date:", error, pdf.createdAt);
                                                    return 'Date not available';
                                                }
                                            })()
                                        ) : (
                                            'Date not available'
                                        )}

                                        <h3 className="font-semibold text-xs truncate text-black line-clamp-2">
                                            {pdf.title}
                                        </h3>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

        </>
    );
};

    const navItems = ['All', 'Videos', 'Blogs', 'Webinars', 'Podcasts', 'Case Studies', 'Info-graphics', 'White-papers', 'Testimonials', 'E-books', 'Demos', 'Events'];

    const handleNavItemChange = (navItem: string) => {
        setActiveNavItem(navItem);
        // Construct the URL with the activeNavItem as a query parameter
        const newUrl = navItem === 'All' ? '/saved' : `/saved?activeNavItem=${navItem}`;
        router.push(newUrl, { scroll: false });
    };

    const renderHeader = () => (
        <header className="sticky top-0 z-10 bg-white shadow-sm">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </Button>
                    <div className="text-xl font-bold ml-2 md:hidden">BizNetwork</div>
                    {session?.user?.name && (
                        <div className="text-xl font-bold ml-2 md:hidden">Welcome, {session.user.name}</div>
                    )}
                </div>

                <div className="hidden md:flex flex-1 items-center max-w-xl mx-4">
                    <div className="relative flex-grow">
                        <Input type="text" placeholder="Search" className="w-full rounded-lg pl-10 pr-4" />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Mic className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                        <Bell size={24} />
                    </Button>

                    {isUserLoggedIn ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="cursor-pointer">
                                    {session?.user?.image ? (
                                        <AvatarImage src={session.user.image} alt="User" />
                                    ) : (
                                        <AvatarImage src="/placeholder-user.jpg" alt="User" />
                                    )}
                                    <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleDashboardRedirect}>
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/profile')}>
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/settings')}>
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleLogout}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/signin">
                            <Button variant="ghost" className="bg-[#2A2FB8]  text-white hidden md:flex items-center h-8 px-2 gap-0">
                                <UserPlus className="w-4 h-4 mr-2" /> Subscribe
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="w-full overflow-x-auto scrollbar-hide ">
                <nav className="flex items-center space-x-2 p-2 snap-x snap-mandatory">
                    {navItems.map((item) => (
                        <Button
                            key={item}
                            variant="ghost"
                            className={`
                                font-normal
                                ${activeNavItem === item
                                    ? "bg-[#2A2FB8] text-white hover:bg-blue-800 hover:text-white"
                                    : "bg-gray-100 text-black hover:bg-gray-300"
                                }
                                ml-2 text-[0.6rem] px-3 py-1 h-7 rounded-md whitespace-nowrap snap-start flex-shrink-0
                            `}
                            onClick={() => handleNavItemChange(item)}
                        >
                            {item}
                        </Button>
                    ))}
                </nav>
            </div>
        </header>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                activeSidebarItem={activeSidebarItem}
                setActiveSidebarItem={setActiveSidebarItem}
                token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
            />
            <div className="flex-1 flex flex-col min-h-screen w-full">
                {renderHeader()}
                <main className="flex-1 overflow-y-auto p-6">
                    <ToastContainer position="top-right" />
                    <h2 className="text-2xl font-bold mb-4">Saved Content</h2>
                    {renderSavedContent()}
                </main>
            </div>
        </div>
    );
}