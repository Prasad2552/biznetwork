//src\app\liked\page.tsx
"use client"
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ToastContainer } from "react-toastify"
import { useContent } from "@/hooks/use-content"
import VideoList from "@/components/VideoList"
import { useRouter } from "next/navigation"
import type { Video, BlogPost, PDFDocument, Content } from "@/types/common"
import Sidebar from '@/components/sidebar';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { Button } from '@/components/ui/button';
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
import BlogPostList from '@/components/BlogPostList';

type ContentType = Video | BlogPost | PDFDocument

export default function Liked() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const { likedContent, removeLike, isLoading } = useContent()


    useEffect(() => {

    }, [likedContent]);

    const likedVideos = likedContent.filter((item): item is Video => item.type === "video")
    const likedBlogPosts = likedContent.filter((item): item is BlogPost => item.type === "blogpost")

    const { token, isUserLoggedIn, isAdmin, handleLogout } = useAuthCheck();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSidebarItem, setActiveSidebarItem] = useState('Liked');
    const [activeNavItem, setActiveNavItem] = useState<string>('All');


    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleDashboardRedirect = () => {
        if (isAdmin) {
            router.push('/admin/channels');
        } else {
            router.push('/dashboard');
        }
    }

    if (status === "unauthenticated") {
        redirect("/login")
    }

    const handleRemove = async (id: string) => {
        await removeLike(id)
    }

   const handleContentClick = (item: Content) => {
        if (!item?.type) {
            console.error("Content type not found:", item)
            return
        }

        switch (item.type) {
            case "video":
                const videoItem = item as Video;
                router.push(`/videos/${videoItem._id}/${videoItem.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
                break;
            default:
                console.error("Unknown content type:", item.type)
        }
    };
    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
    }



    const mappedVideos = likedVideos.map((item) => {

        return {
            ...item,
            channel: item.channel || item.author || "Biz", // Add default value
            channelLogo: item.channelLogo || item.logo || "/uploads/biznetwork.png", // Add default image
            description: item.description || "",
            thumbnailUrl: item.thumbnailUrl || "/uploads/biznetwork.png",
            views: item.views || 0,
            likes: item.likes || 0,
            dislikes: item.dislikes || 0,
            duration: item.duration || "0",
            commentCount: item.commentCount || 0,
            likedBy: item.likedBy || [],
            dislikedBy: item.dislikedBy || [],
            categories: item.categories || {},
            status: item.status || "published",
            slug: item.slug || item._id,
        }
    })


    const mappedBlogPosts = likedBlogPosts.map((item) => ({
        ...item,
        channel: item.channel || item.author || "Biz",
        channelLogo: item.channelLogo || item.logo || "/uploads/biznetwork.png",
        description: item.description || "",
        views: item.views || 0,
        likes: item.likes || 0,
        dislikes: item.dislikes || 0,
        slug: item.slug || item._id,
        createdAt: item.createdAt // Ensure createdAt is included

    }));
    useEffect(() => {
       
    }, [mappedBlogPosts]);

    const navItems = ['All', 'Videos', 'Blogs', 'Webinars', 'Podcasts', 'Case Studies', 'Info-graphics', 'White-papers', 'Testimonials', 'E-books', 'Demos', 'Events'];

    const handleNavItemChange = (navItem: string) => {
        setActiveNavItem(navItem);
        const newUrl = navItem === 'All' ? '/liked' : `/liked?activeNavItem=${navItem}`;
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
                                        <AvatarImage src="/uploads/biznetwork.png" alt="User" />
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
                    <h2 className="text-2xl font-bold mb-4">Liked Content</h2>
                    <VideoList videos={mappedVideos} onVideoClick={handleContentClick} formatDuration={formatDuration} />

                    {/* Liked BlogPosts */}
                    {mappedBlogPosts.length > 0 && (
                        <>
                            <h3 className="text-xl font-semibold mt-8 mb-4">Liked Blog Posts</h3>
                            <BlogPostList blogPosts={mappedBlogPosts}  />
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}