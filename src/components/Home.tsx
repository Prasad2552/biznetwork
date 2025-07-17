// src/app/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, createContext, useContext } from "react";
import dynamic from 'next/dynamic';
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { toast, ToastContainer } from "react-toastify";
import { ImageLightbox } from "@/components/image-lightbox";
import "react-toastify/dist/ReactToastify.css";
import { format, formatDistanceToNow } from 'date-fns';
import { Heart, Bookmark, Menu, UserPlus, Bell } from "lucide-react";
import { type VideoPlayerRef } from "@/components/video-player";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { useVideos } from "@/hooks/useVideos";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { usePDFDocuments } from "@/hooks/usePDFDocuments";
import { useComments } from "@/hooks/useComments";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useTechNews } from "@/hooks/useTechNews";
import { BlogPostCard } from "@/components/BlogPostCard";
import { SearchInput } from "@/components/search-input";
import { FeaturedVideoCard } from "@/components/FeaturedVideoCard";
import { Video, type CaseStudy, Content, TechNews, BlogPost } from "@/types/common";

// Lazy loaded components
const VideoList = React.lazy(() => import("@/components/VideoList"));
const PDFGrid = React.lazy(() => import("@/components/pdf-grid"));
const CommentSection = React.lazy(() => import("@/components/CommentSection"));
const UpNextList = React.lazy(() => import("@/components/UpNextList"));

// Dynamically import Sidebar to avoid SSR issues
const Sidebar = dynamic(() => import("@/components/sidebar"), {
    ssr: false,
    loading: () => <div className="w-64 bg-gray-100" />,
});

// --- TYPE DEFINITIONS ---
interface Params {
    videoId?: string;
    slug?: string;
}

interface VideoPageProps {
    params: Promise<Params>;
}

// --- UTILITY FUNCTIONS ---
const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const getStoredSubscriberCount = (channelId: string) => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(`channel-${channelId}-subscribers`);
    return stored ? Number.parseInt(stored, 10) : 0;
};

const setStoredSubscriberCount = (channelId: string, count: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`channel-${channelId}-subscribers`, count.toString());
};


// --- REFACTORED & DECOMPOSED COMPONENTS ---

// ## 1. Header Component
const PageHeader = ({ isUserLoggedIn, isAdmin, session, handleLogout, toggleSidebar, activeNavItem, handleNavItemChange, handleDashboardRedirect }) => {
    const navItems = ['All', 'Videos', 'Blogs', 'Webinars', 'Podcasts', 'Case-Studies', 'Info-graphics', 'White-papers', 'Testimonials', 'E-books', 'Demos', 'Events', 'Tech News'];

    return (
        <header className="sticky top-0 z-10 bg-white shadow-sm">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </Button>
                </div>
                <div className="flex-1 items-center md:max-w-xl mx-1 md:mx-4 md:flex">
                    <SearchInput />
                </div>
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className="md:inline-flex">
                        <Bell size={24} />
                    </Button>
                    {isUserLoggedIn ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="cursor-pointer">
                                    <AvatarImage src={session?.user?.image || "/placeholder-user.jpg"} alt="User" />
                                    <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleDashboardRedirect}>Dashboard</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleLogout}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/signin">
                            <Button variant="default" className="bg-blue-800 text-white items-center h-8 px-2 gap-0 md:text-md text-xs md:gap-0 md:h-8 md:px-2 md:flex">
                                <UserPlus className="w-4 h-4 mr-1 md:mr-2" />
                                Subscribe
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
            <div className="w-full overflow-x-auto scrollbar-hide">
                <nav className="flex items-center space-x-2 p-2 snap-x snap-mandatory">
                    {navItems.map((item) => (
                        <Button
                            key={item}
                            variant="ghost"
                            className={`font-normal ${activeNavItem === item ? "bg-[#2A2FB8] text-white hover:bg-blue-800 hover:text-white" : "bg-gray-100 text-black hover:bg-gray-300"} ml-2 text-[0.6rem] px-3 py-1 h-7 rounded-md whitespace-nowrap snap-start flex-shrink-0`}
                            onClick={() => handleNavItemChange(item)}
                        >
                            {item}
                        </Button>
                    ))}
                </nav>
            </div>
        </header>
    );
};

// ## 2. Video Player View (When a videoId is in the URL)
const VideoPlayerView = ({
    video, handleLike, handleDislike, handleCommentSubmit, isVideoLiked, isVideoDisliked,
    handleSelectedVideoView, handleSelectedVideoSubscriberCountChange, subscriberCount,
    comments, setComments, upNextVideos, handleUpNextVideoClick, updateVideoState
}) => {
    const [isCommentInputVisible, setIsCommentInputVisible] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

    if (!video) {
        return <div className="flex justify-center items-center h-full">Loading video...</div>;
    }

    return (
        <div className='flex flex-col md:flex-row gap-4'>
            <div className="flex-1">
                <FeaturedVideoCard
                    featuredVideo={video}
                    handleLike={handleLike}
                    handleDislike={handleDislike}
                    handleEmptyVideoView={handleSelectedVideoView}
                    handleFeaturedVideoSubscriberCountChange={handleSelectedVideoSubscriberCountChange}
                    isCommentInputVisible={isCommentInputVisible}
                    setIsCommentInputVisible={setIsCommentInputVisible}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    handleCommentSubmit={handleCommentSubmit}
                    isVideoLiked={isVideoLiked}
                    isVideoDisliked={isVideoDisliked}
                    subscriberCount={subscriberCount}
                    comments={comments}
                    setComments={setComments}
                    commentCount={video.commentCount || 0}
                    key={video._id}
                    updateVideoState={updateVideoState}
                />

                {video.type === 'event' && video.eventImageUrls && video.eventImageUrls.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Event Gallery</h3>
                        <div className="relative overflow-x-auto snap-x snap-mandatory md:overflow-x-visible md:w-full md:snap-none">
                            <div className="flex gap-4 pb-2 md:justify-start">
                                {video.eventImageUrls.map((imageUrl, index) => (
                                    <div
                                        key={index}
                                        className="inline-block relative w-28 h-20 rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 hover:ring-1 ring-primary snap-start shrink-0 md:shrink"
                                        onClick={() => {
                                            setLightboxInitialIndex(index);
                                            setIsLightboxOpen(true);
                                        }}
                                    >
                                        <Image src={imageUrl || "/placeholder.svg"} alt={`Event image ${index + 1}`} fill className="object-cover rounded-lg" sizes="140px" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <ImageLightbox images={video.eventImageUrls} initialIndex={lightboxInitialIndex} isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} />
                    </div>
                )}
                
                 <div className="mt-6">
                    <Suspense fallback={<div>Loading Comments...</div>}>
                        <CommentSection commentCount={video?.commentCount || 0} comments={comments} videoId={video?._id} setComments={setComments} />
                    </Suspense>
                </div>
            </div>
            <aside className="w-full md:w-80">
                <h3 className="text-lg font-semibold mb-2">Up Next</h3>
                <Suspense fallback={<div>Loading Up Next...</div>}>
                    <UpNextList videos={upNextVideos} onVideoClick={handleUpNextVideoClick} formatDuration={formatDuration} />
                </Suspense>
            </aside>
        </div>
    );
};

// ## 3. Blog Grid View
const BlogGrid = ({ blogPosts, handleSelectedVideoSubscriberCountChange }) => {
    const horizontalPosts = useMemo(() => blogPosts?.filter(post => post.orientation !== 'vertical') || [], [blogPosts]);
    const verticalPosts = useMemo(() => blogPosts?.filter(post => post.orientation === 'vertical') || [], [blogPosts]);

    const interweavedPosts = useMemo(() => {
        if (!blogPosts || blogPosts.length === 0) return [];
        const posts: (BlogPost | null)[] = [];
        const numColumns = 3;
        let hIndex = 0;
        let vIndex = 0;
        const totalPosts = horizontalPosts.length + verticalPosts.length;

        for (let i = 0; i < totalPosts; i++) {
            const columnIndex = i % numColumns;
            if (columnIndex === 1 && vIndex < verticalPosts.length) {
                posts.push(verticalPosts[vIndex++]);
            } else if (hIndex < horizontalPosts.length) {
                posts.push(horizontalPosts[hIndex++]);
            }
        }
        return posts;
    }, [blogPosts, horizontalPosts, verticalPosts]);

    if (!blogPosts || blogPosts.length === 0) {
        return <div>No blog posts available</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 p-6 grid-auto-flow-dense">
            {interweavedPosts.map((post) => (
                post ? <BlogPostCard key={post._id} post={post} handleSelectedVideoSubscriberCountChange={handleSelectedVideoSubscriberCountChange} /> : null
            ))}
        </div>
    );
};

// ## 4. Tech News Grid View
const TechNewsGrid = ({ techNews, isLoading, error }) => {
    if (isLoading) return <div>Loading Tech News...</div>;
    if (error) return <div>Error loading Tech News: {error}</div>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            {techNews.map((newsItem) => (
                <Link href={`/tech-news/${newsItem.slug}`} key={newsItem._id}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow border-none mt-6 bg-gray-50">
                        <CardContent className="p-2 flex items-center space-x-4">
                            <Image src={newsItem.featuredImage || "/placeholder.svg"} alt={newsItem.title} width={80} height={80} className="rounded w-[60px] h-auto object-cover" sizes="60px" loading='lazy' />
                            <div className="w-3/4">
                                <p className="font-normal text-xs text-gray-600">{formatDistanceToNow(new Date(newsItem.createdAt))} ago</p>
                                <h3 className="font-semibold text-xs text-black line-clamp-2">{newsItem.title}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
};

// ## 5. Default "All" Content Layout
const AllContentLayout = ({
    featuredVideo, handleLike, handleDislike, handleFeaturedVideoView, handleFeaturedVideoSubscriberCountChange,
    handleCommentSubmit, isVideoLiked, isVideoDisliked, subscriberCount, comments, setComments,
    upNextVideos, handleUpNextVideoClick, popularBlogs, popularWebinarVideos, popularEventVideos,
    handleWebinarClick, handleEventClick, techNews, handleNavItemChange, updateVideoState
}) => {
    const [isCommentInputVisible, setIsCommentInputVisible] = useState(false);
    const [newComment, setNewComment] = useState('');

    return (
        <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="flex-1">
                {featuredVideo && (
                    <>
                        <FeaturedVideoCard
                            featuredVideo={featuredVideo}
                            handleLike={handleLike}
                            handleDislike={handleDislike}
                            handleEmptyVideoView={handleFeaturedVideoView}
                            handleFeaturedVideoSubscriberCountChange={handleFeaturedVideoSubscriberCountChange}
                            isCommentInputVisible={isCommentInputVisible}
                            setIsCommentInputVisible={setIsCommentInputVisible}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            handleCommentSubmit={handleCommentSubmit}
                            isVideoLiked={isVideoLiked}
                            isVideoDisliked={isVideoDisliked}
                            subscriberCount={subscriberCount}
                            comments={comments}
                            setComments={setComments}
                            commentCount={featuredVideo?.commentCount || 0}
                            key={featuredVideo?._id}
                            updateVideoState={updateVideoState}
                        />
                         <div className="mt-6">
                             <Suspense fallback={<div>Loading Comments...</div>}>
                                 <CommentSection commentCount={featuredVideo.commentCount || 0} comments={comments} videoId={featuredVideo._id} setComments={setComments} />
                             </Suspense>
                         </div>
                    </>
                )}

                <div className="mb-4 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Most Popular Blogs</h2>
                        <Button variant="default" className="bg-[#2A2FB8] text-white text-xs font-medium rounded-full px-4 py-1 h-8" onClick={() => handleNavItemChange('Blogs')}>View all</Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                        {popularBlogs.map((post) => (
                            <Link href={`/blog/posts/${post.slug}`} key={post._id}>
                                <Card className="flex items-center p-4 h-[120px] w-full">
                                    <div className="w-24 h-24 relative flex-shrink-0 rounded overflow-hidden mr-4">
                                        <Image src={post.featuredImage || "/placeholder.svg"} alt={post.title} fill className="object-cover rounded" loading="lazy" />
                                    </div>
                                    <div className="flex flex-col justify-between flex-1 h-full overflow-hidden">
                                        <h3 className="font-semibold text-sm line-clamp-2">{post.title}</h3>
                                        <div className="flex items-center space-x-2 mt-auto">
                                            <Button variant="ghost" size="icon"><Bookmark className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon"><Heart className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                 <div className="mb-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold">Most Popular Webinars</h2>
                        <Button variant="default" className="bg-[#2A2FB8] text-white text-xs font-medium rounded-full px-4 py-1 h-8" onClick={() => handleNavItemChange('Webinars')}>View all</Button>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                         {popularWebinarVideos.map((video) => (
                             <Card key={video._id} className="flex items-center p-4 h-[120px] w-full cursor-pointer hover:shadow-md transition-shadow border-none bg-gray-50" onClick={() => handleWebinarClick(video)}>
                                 <div className="w-24 h-24 relative flex-shrink-0 rounded overflow-hidden mr-4">
                                     <Image src={video.thumbnailUrl || "/placeholder.svg"} alt={video.title} fill className="object-cover rounded" loading="lazy" />
                                 </div>
                                 <div className="flex flex-col justify-between flex-1 h-full overflow-hidden">
                                     <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                                     <div className="flex items-center space-x-2 mt-auto">
                                         <Button variant="ghost" size="icon"><Bookmark className="h-4 w-4" /></Button>
                                         <Button variant="ghost" size="icon"><Heart className="h-4 w-4" /></Button>
                                     </div>
                                 </div>
                             </Card>
                         ))}
                     </div>
                 </div>

                 <div className="mb-4">
                     <div className="flex items-center justify-between mb-4">
                         <h2 className="text-xl font-semibold">Most Popular Events</h2>
                         <Button variant="default" className="bg-[#2A2FB8] text-white text-xs font-medium rounded-full px-4 py-1 h-8" onClick={() => handleNavItemChange('Events')}>View all</Button>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                         {popularEventVideos.map((video) => (
                             <Card key={video._id} className="flex items-center p-4 h-[120px] w-full cursor-pointer hover:shadow-md transition-shadow border-none bg-gray-50" onClick={() => handleEventClick(video)}>
                                 <div className="w-24 h-24 relative flex-shrink-0 rounded overflow-hidden mr-4">
                                     <Image src={video.thumbnailUrl || "/placeholder.svg"} alt={video.title} fill className="object-cover rounded" loading="lazy" />
                                 </div>
                                 <div className="flex flex-col justify-between flex-1 h-full overflow-hidden">
                                     <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                                     <div className="flex items-center space-x-2 mt-auto">
                                         <Button variant="ghost" size="icon"><Bookmark className="h-4 w-4" /></Button>
                                         <Button variant="ghost" size="icon"><Heart className="h-4 w-4" /></Button>
                                     </div>
                                 </div>
                             </Card>
                         ))}
                     </div>
                 </div>
            </div>
            <aside className="w-full md:w-64 mt-8 md:mt-0">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Up Next</h2>
                    <Suspense fallback={<div>Loading Up Next...</div>}>
                        <UpNextList videos={upNextVideos} onVideoClick={handleUpNextVideoClick} formatDuration={formatDuration} />
                    </Suspense>
                </div>
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Tech News</h2>
                    {techNews && techNews.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {techNews.map((newsItem) => (
                                <Link key={newsItem._id} href={`/tech-news/${newsItem.slug}`}>
                                    <Card className="cursor-pointer hover:shadow-md transition-shadow border-none bg-gray-50">
                                        <CardContent className="p-2 flex items-center space-x-4">
                                            <Image src={newsItem.featuredImage || "/placeholder.svg"} alt={newsItem.title} width={80} height={80} className="rounded w-[80px] h-auto object-cover" sizes="80px" loading='lazy' />
                                            <div className="w-3/4">
                                                <p className="font-normal text-xs text-gray-600">{format(new Date(newsItem.createdAt), 'dd MMMM yyyy')}</p>
                                                <h3 className="font-semibold text-xs text-black line-clamp-2">{newsItem.title}</h3>
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
            </aside>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
function Home({ params }: VideoPageProps) {
    const router = useRouter();
    const searchParamsHook = useSearchParams();
    const [activeSidebarItem, setActiveSidebarItem] = useState('Home');
    const [activeNavItem, setActiveNavItem] = useState<string>('All');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [videoId, setVideoId] = useState<string | undefined>(undefined);
    const { isUserLoggedIn, isAdmin, handleLogout, token } = useAuthCheck();
    const { data: session } = useSession();

    // Data fetching hooks
    const { videos, webinars, podcasts, testimonials, demos, events, featuredVideo, upNextVideos, updateVideoState, setFeaturedVideo, setVideos } = useVideos();
    const { blogPosts, popularBlogs } = useBlogPosts();
    const { pdfDocuments } = usePDFDocuments();
    const { comments, fetchComments, setComments } = useComments();
    const { techNews, isLoading: isTechNewsLoading, error: techNewsError } = useTechNews();

    // State for view tracking and subscriber counts
    const [hasFeaturedVideoBeenViewed, setHasFeaturedVideoBeenViewed] = useState(false);
    const [hasSelectedVideoBeenViewed, setHasSelectedVideoBeenViewed] = useState(false);
    const [selectedVideoSubscriberCount, setSelectedVideoSubscriberCount] = useState(0);
    const [featuredVideoSubscriberCount, setFeaturedVideoSubscriberCount] = useState(0);

    // --- CORE LOGIC HANDLERS ---
    const handleViewCountUpdate = useCallback(async (id: string, contentType: string = 'video') => {
        const apiMap = { video: 'videos', webinar: 'webinars', podcast: 'podcasts', demo: 'demos', event: 'events' };
        const endpoint = apiMap[contentType.toLowerCase()] || 'videos';
        try {
            const response = await fetch(`/api/${endpoint}/${id}/view`, { method: 'POST' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            const stateUpdaterMap = { videos: setVideos, webinars: (d) => {}, /* add other setters if needed */ };
            const updater = stateUpdaterMap[endpoint];
            if (updater) {
                updater(prev => prev.map(item => item._id === id ? { ...item, views: data.views } : item));
            }
            if (selectedVideo?._id === id) setSelectedVideo(prev => ({ ...prev!, views: data.views }));
            if (featuredVideo?._id === id) setFeaturedVideo(prev => ({ ...prev!, views: data.views }));
        } catch (error) {
            console.error('Error updating view count:', error);
            toast.error('Error updating view count.');
        }
    }, [videos, selectedVideo, featuredVideo, setFeaturedVideo, setVideos]);

    const handleHistoryUpdate = useCallback(async (id: string) => {
        if (!token) return;
        try {
            await fetch(`/api/videos/${id}/history`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error updating video history:', error);
        }
    }, [token]);

    const handleVideoView = useCallback(async (id: string, isFeatured = false, contentType: string = 'video') => {
        const hasViewed = isFeatured ? hasFeaturedVideoBeenViewed : hasSelectedVideoBeenViewed;
        if (hasViewed) return;

        if (isFeatured) setHasFeaturedVideoBeenViewed(true);
        else setHasSelectedVideoBeenViewed(true);

        await handleViewCountUpdate(id, contentType);
        if (isUserLoggedIn) await handleHistoryUpdate(id);
    }, [hasFeaturedVideoBeenViewed, hasSelectedVideoBeenViewed, isUserLoggedIn, handleViewCountUpdate, handleHistoryUpdate]);

    const handleContentSelection = useCallback(async (item: Content) => {
        const videoId = item._id.replace('webinar', ''); // Handle potential prefixes
        const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const navItem = item.type ? `${item.type}s` : 'videos'; // e.g., 'webinar' -> 'webinars'

        router.push(`/${navItem}/${videoId}/${slug}`, { scroll: false });
        
        // The useEffect for `params` will handle fetching the video data
    }, [router]);

    const handleLike = useCallback(async (videoId: string) => {
        if (!session?.user?.id) return toast.error("Please sign in to like videos");
        try {
            const response = await fetch(`/api/videos/${videoId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to like video');
            const data = await response.json();
            updateVideoState(videoId, data);
        } catch (error) {
            toast.error("An error occurred while liking the video.");
        }
    }, [session, token, updateVideoState]);

    const handleDislike = useCallback(async (videoId: string) => {
        if (!session?.user?.id) return toast.error("Please sign in to dislike videos");
        try {
            const response = await fetch(`/api/videos/${videoId}/dislike`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to dislike video');
            const data = await response.json();
            updateVideoState(videoId, data);
        } catch (error) {
            toast.error("An error occurred while disliking the video.");
        }
    }, [session, token, updateVideoState]);

    const handleCommentSubmit = useCallback(async (videoId: string, newComment: string) => {
        if (!isUserLoggedIn) return toast.info('Please sign in to add a comment.');
        try {
            const response = await fetch(`/api/videos/${videoId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: newComment }),
            });
            if (!response.ok) throw new Error('Failed to submit comment');
            const data = await response.json();
            setComments(prevComments => [data, ...prevComments]);
            
            // Optimistically update comment count
            const updateCount = (video) => video ? { ...video, commentCount: (video.commentCount || 0) + 1 } : null;
            if (videos) setVideos(prev => prev.map(v => v._id === videoId ? updateCount(v) : v));
            if (selectedVideo?._id === videoId) setSelectedVideo(updateCount);
            if (featuredVideo?._id === videoId) setFeaturedVideo(updateCount);

            toast.success("Comment submitted!");
        } catch (error) {
            console.error('Error submitting comment:', error);
            toast.error("An error occurred while submitting the comment.");
        }
    }, [isUserLoggedIn, token, setComments, videos, setVideos, selectedVideo, featuredVideo, setFeaturedVideo]);

    const handleDashboardRedirect = () => router.push(isAdmin ? '/admin/channels' : '/dashboard');

    const handleNavItemChange = (navItem: string) => {
        setActiveNavItem(navItem);
        setSelectedVideo(null); // Clear selected video when changing category
        setVideoId(undefined); // Clear videoId state
        const newUrl = navItem === 'All' ? '/' : `/?activeNavItem=${navItem}`;
        router.push(newUrl, { scroll: false });
    };

    // --- useEffect Hooks for orchestrating logic ---
    useEffect(() => {
        // Effect to resolve params and set videoId state
        const resolveParams = async () => {
            const resolvedParams = await params;
            setVideoId(resolvedParams.videoId);
        };
        resolveParams();
    }, [params]);

    useEffect(() => {
        // Effect to fetch video when videoId is set/changed
        const fetchVideoById = async (id: string) => {
            const typeParam = searchParamsHook?.get('activeNavItem')?.toLowerCase().replace(/s$/, "") || 'video';
            try {
                const url = `/api/videos/${id}?type=${typeParam}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch video");
                const data = await response.json();

                setSelectedVideo({
                    ...data,
                    videoUrl: data.videoUrl || data.filePath,
                    thumbnailUrl: data.thumbnailUrl || data.featureImageUrl,
                    eventImageUrls: data.eventImageUrls || [],
                });
                setSelectedVideoSubscriberCount(getStoredSubscriberCount(data.channel) || data.subscriberCount || 0);
                fetchComments(id);
                setHasSelectedVideoBeenViewed(false); // Reset view tracking for the new video
                handleVideoView(id, false, data.type);
            } catch (error) {
                console.error("Error fetching video:", error);
                toast.error(`Failed to load video: ${error.message}`);
            }
        };

        const navItem = searchParamsHook?.get('activeNavItem');
        if (videoId) {
            if (navItem) setActiveNavItem(navItem);
            fetchVideoById(videoId);
        } else if (navItem) {
            setActiveNavItem(navItem);
            setSelectedVideo(null);
        } else {
            setActiveNavItem('All');
            setSelectedVideo(null);
        }
    }, [videoId, searchParamsHook, handleVideoView, fetchComments]);
    
    // --- MEMOIZED VALUES for performance ---
    const popularWebinarVideos = useMemo(() => webinars?.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 2) || [], [webinars]);
    const popularEventVideos = useMemo(() => events?.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 2) || [], [events]);
    const isVideoLiked = (video) => video && session?.user?.id ? video.likedBy?.includes(session.user.id) : false;
    const isVideoDisliked = (video) => video && session?.user?.id ? video.dislikedBy?.includes(session.user.id) : false;

    // --- RENDER LOGIC ---
    const renderCategorizedContent = () => {
        const videoContent = { 'Videos': videos, 'Webinars': webinars, 'Podcasts': podcasts, 'Testimonials': testimonials, 'Demos': demos, 'Events': events };
        if (videoContent[activeNavItem]) {
            return (
                <Suspense fallback={<div>Loading...</div>}>
                    <VideoList videos={videoContent[activeNavItem] || []} onVideoClick={handleContentSelection} formatDuration={formatDuration} />
                </Suspense>
            );
        }
        const pdfContent = { 'Case-Studies': 'casestudies', 'Info-graphics': 'infographics', 'White-papers': 'whitepapers', 'E-books': 'ebooks' };
        if (pdfContent[activeNavItem]) {
            return (
                <Suspense fallback={<div>Loading Documents...</div>}>
                    <PDFGrid documents={pdfDocuments.filter(doc => doc.type === pdfContent[activeNavItem])} category={activeNavItem} />
                </Suspense>
            );
        }
        switch (activeNavItem) {
            case 'Blogs':
                return <BlogGrid blogPosts={blogPosts} handleSelectedVideoSubscriberCountChange={(c) => {}} />;
            case 'Tech News':
                return <TechNewsGrid techNews={techNews} isLoading={isTechNewsLoading} error={techNewsError} />;
            default:
                return <AllContentLayout
                    featuredVideo={featuredVideo}
                    handleLike={handleLike}
                    handleDislike={handleDislike}
                    handleFeaturedVideoView={() => featuredVideo && handleVideoView(featuredVideo._id, true)}
                    handleFeaturedVideoSubscriberCountChange={setFeaturedVideoSubscriberCount}
                    handleCommentSubmit={(id, comment) => handleCommentSubmit(id, comment)}
                    isVideoLiked={() => isVideoLiked(featuredVideo)}
                    isVideoDisliked={() => isVideoDisliked(featuredVideo)}
                    subscriberCount={featuredVideo?.subscriberCount || featuredVideoSubscriberCount}
                    comments={comments}
                    setComments={setComments}
                    upNextVideos={upNextVideos}
                    handleUpNextVideoClick={handleContentSelection}
                    popularBlogs={popularBlogs}
                    popularWebinarVideos={popularWebinarVideos}
                    popularEventVideos={popularEventVideos}
                    handleWebinarClick={handleContentSelection}
                    handleEventClick={handleContentSelection}
                    techNews={techNews.slice(0, 4)}
                    handleNavItemChange={handleNavItemChange}
                    updateVideoState={updateVideoState}
                />;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                activeSidebarItem={activeSidebarItem}
                setActiveSidebarItem={setActiveSidebarItem}
                token={token || ""}
                isUserLoggedIn={!!isUserLoggedIn}
            />
            <div className="flex-1 flex flex-col min-h-screen w-full">
                <PageHeader
                    isUserLoggedIn={isUserLoggedIn}
                    isAdmin={isAdmin}
                    session={session}
                    handleLogout={handleLogout}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    activeNavItem={activeNavItem}
                    handleNavItemChange={handleNavItemChange}
                    handleDashboardRedirect={handleDashboardRedirect}
                />
                <main className="flex-1 overflow-y-auto p-4">
                    {videoId ? (
                        <VideoPlayerView
                            video={selectedVideo}
                            handleLike={handleLike}
                            handleDislike={handleDislike}
                            handleCommentSubmit={(id, comment) => handleCommentSubmit(id, comment)}
                            isVideoLiked={() => isVideoLiked(selectedVideo)}
                            isVideoDisliked={() => isVideoDisliked(selectedVideo)}
                            handleSelectedVideoView={() => selectedVideo && handleVideoView(selectedVideo._id, false, selectedVideo.type)}
                            handleSelectedVideoSubscriberCountChange={(count) => {
                                if (selectedVideo?.channel) {
                                    setSelectedVideoSubscriberCount(count);
                                    setStoredSubscriberCount(selectedVideo.channel, count);
                                }
                            }}
                            subscriberCount={selectedVideo?.subscriberCount || selectedVideoSubscriberCount}
                            comments={comments}
                            setComments={setComments}
                            upNextVideos={upNextVideos}
                            handleUpNextVideoClick={handleContentSelection}
                            updateVideoState={updateVideoState}
                        />
                    ) : (
                        renderCategorizedContent()
                    )}
                </main>
            </div>
            <ToastContainer position='top-right' />
        </div>
    );
}

export default Home;
