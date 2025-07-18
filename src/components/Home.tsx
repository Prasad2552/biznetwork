// src/app/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import dynamic from 'next/dynamic';
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { toast, ToastContainer } from "react-toastify";
import { ImageLightbox } from "@/components/image-lightbox"
import "react-toastify/dist/ReactToastify.css";
import { format } from 'date-fns'
import {
    Heart,
    Bookmark,
    Menu,
    UserPlus,
    Bell,
} from "lucide-react";
import { type VideoPlayerRef } from "@/components/video-player";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { useVideos } from "@/hooks/useVideos";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { usePDFDocuments } from "@/hooks/usePDFDocuments";
import { useComments } from "@/hooks/useComments";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { BlogPostCard } from "@/components/BlogPostCard";
import { SearchInput } from "@/components/search-input";
import { FeaturedVideoCard } from "@/components/FeaturedVideoCard";
import { Video, type CaseStudy, Content, TechNews } from "@/types/common";
import { useTechNews } from "@/hooks/useTechNews";



// Lazy loaded components
const VideoList = React.lazy(() => import("@/components/VideoList"));
const PDFGrid = React.lazy(() => import("@/components/pdf-grid"));
const CommentSection = React.lazy(() => import("@/components/CommentSection"));
const UpNextList = React.lazy(() => import("@/components/UpNextList"));

interface Params {
    videoId?: string;
    slug?: string;
}

interface VideoPageProps {
  params: Promise<Params>;
}

interface BlogPost {
    _id: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    createdAt: string;
    tags: string[];
    featuredImage?: string;
    channelId?: string;
    channelLogo?: string;
    isVerified?: boolean;
    views: string;
    slug?: string;
    orientation?: 'horizontal' | 'vertical';
}

function Home({ params }: VideoPageProps) {
    const router = useRouter();
    const searchParamsHook = useSearchParams();
    const [activeSidebarItem, setActiveSidebarItem] = useState('Home');
    const [activeNavItem, setActiveNavItem] = useState<string>('All');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [isCommentInputVisible, setIsCommentInputVisible] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
    const [newComment, setNewComment] = useState('');
    const videoPlayerRef = useRef<VideoPlayerRef>(null);
    const { isUserLoggedIn, isAdmin, handleLogout, token } = useAuthCheck();
    const { data: session } = useSession();
    const { videos, webinars, podcasts, testimonials, demos, events, featuredVideo, upNextVideos,  updateVideoState, setFeaturedVideo, setVideos } = useVideos();
    const { blogPosts, popularBlogs } = useBlogPosts();
    const { pdfDocuments} = usePDFDocuments();
    const { comments, fetchComments, setComments } = useComments();
    const [hasFeaturedVideoBeenViewed, setHasFeaturedVideoBeenViewed] = useState(false);
    const [hasSelectedVideoBeenViewed, setHasSelectedVideoBeenViewed] = useState(false);
    const [selectedVideoSubscriberCount, setSelectedVideoSubscriberCount] = useState(0);
    const [featuredVideoSubscriberCount, setFeaturedVideoSubscriberCount] = useState(0);
    const [videoId, setVideoId] = useState<string | undefined>(undefined);
    const imageGalleryRef = useRef<HTMLDivElement>(null);

    const { techNews, isLoading: isTechNewsLoading, error: techNewsError } = useTechNews();

    // Dynamically import Sidebar to avoid SSR issues
    const Sidebar = dynamic(() => import("@/components/sidebar"), {
      ssr: false,
      loading: () => <div className="w-64 bg-gray-100" />,
    });

    // Top-level useMemo hooks for consistent rendering
    const horizontalPosts = useMemo(
        () => blogPosts?.filter(post => post.orientation !== 'vertical') || [],
        [blogPosts]
    );

    const verticalPosts = useMemo(
        () => blogPosts?.filter(post => post.orientation === 'vertical') || [],
        [blogPosts]
    );

    const interweavedPosts = useMemo(() => {
        if (!blogPosts || blogPosts.length === 0) return [];
        const posts: (BlogPost | null)[] = [];
        const numColumns = 3;
        let hIndex = 0;
        let vIndex = 0;
        for (let i = 0; i < blogPosts.length; i++) {
            const columnIndex = i % numColumns;
            if (columnIndex === 1 && vIndex < verticalPosts.length) {
                posts.push(verticalPosts[vIndex]);
                vIndex++;
            } else if (hIndex < horizontalPosts.length) {
                posts.push(horizontalPosts[hIndex]);
                hIndex++;
            } else {
                posts.push(null);
            }
        }
        return posts;
    }, [blogPosts, horizontalPosts, verticalPosts]);

    const popularWebinarVideos = useMemo(
        () => webinars?.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 2) || [],
        [webinars]
    );

    const popularEventVideos = useMemo(
        () => events?.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 2) || [],
        [events]
    );

    const handleSelectedVideoSubscriberCountChange = useCallback((count: number) => {
        if (selectedVideo?.channel) {
            setSelectedVideoSubscriberCount(count);
            setStoredSubscriberCount(selectedVideo.channel, count);
        }
    }, [selectedVideo?.channel]);

    const handleFeaturedVideoSubscriberCountChange = useCallback((count: number) => {
        setFeaturedVideoSubscriberCount(count);
    }, []);

    const getStoredSubscriberCount = (channelId: string) => {
        const stored = localStorage.getItem(`channel-${channelId}-subscribers`);
        return stored ? Number.parseInt(stored, 10) : 0;
    };

    const setStoredSubscriberCount = (channelId: string, count: number) => {
        localStorage.setItem(`channel-${channelId}-subscribers`, count.toString());
    };

    const handleViewCountUpdate = useCallback(async (id: string, contentType: string = 'video') => {
    try {
        // Determine the correct API endpoint based on content type
        let apiEndpoint = '';
        switch (contentType.toLowerCase()) {
            case 'webinar':
                apiEndpoint = `/api/webinars/${id}/view`;
                break;
            case 'podcast':
                apiEndpoint = `/api/podcasts/${id}/view`;
                break;
            case 'demo':
                apiEndpoint = `/api/demos/${id}/view`;
                break;
            case 'event':
                apiEndpoint = `/api/events/${id}/view`;
                break;
            case 'video':
            default:
                apiEndpoint = `/api/videos/${id}/view`;
                break;
        }

        
        const response = await fetch(apiEndpoint, {
            method: 'POST', // ✅ Changed from PUT to POST
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData?.error || errorMessage;
            } catch (jsonError) {
                console.error('Failed to parse error response:', jsonError);
            }
            console.error('Error updating view count:', errorMessage);
            toast.error(`Error updating view count: ${errorMessage}`, { position: 'top-right' });
            return;
        }

        const data = await response.json();

        // Update the appropriate state based on content type
        if (contentType === 'video' && videos) {
            setVideos(prevVideos =>
                prevVideos.map(video =>
                    video._id === id ? { ...video, views: data.views } : video
                )
            );
        }

        // Update selected video if it matches
        if (selectedVideo && selectedVideo._id === id) {
            setSelectedVideo(prev => ({
                ...prev!,
                views: data.views
            }));
        }

        // Update featured video if it matches
        if (featuredVideo && featuredVideo._id === id) {
            setFeaturedVideo(prev => ({
                ...prev!,
                views: data.views
            }));
        }

    } catch (error) {
        console.error('Error updating view count:', error);
        toast.error('An error occurred while updating view count. Please try again.', { position: 'top-right' });
    }
}, [videos, selectedVideo, featuredVideo, setFeaturedVideo, setVideos]);

    const handleHistoryUpdate = useCallback(async (id: string) => {
        try {
            const historyResponse = await fetch(`/api/videos/${id}/history`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!historyResponse.ok) {
                const errorData = await historyResponse.json();
                const errorMessage = errorData?.error || historyResponse.statusText;
                console.error('Error updating video history:', errorMessage);
                toast.error(`Failed to add in video history: ${errorMessage}`, { position: 'top-right' });
            }
        } catch (error) {
            console.error('Error updating video history:', error);
            toast.error(`An error occurred while updating history. Please try again.`, { position: 'top-right' });
        }
    }, [token]);

    const handleWebinarClick = (video: Content) => {
        handleUpNextVideoClick(video);
    };

    const handleEventClick = (video: Content) => {
        handleUpNextVideoClick(video);
    };

    const handleVideoView = useCallback(async (id: string, isFeatured = false, contentType: string = 'video') => {
    const hasViewed = isFeatured ? hasFeaturedVideoBeenViewed : hasSelectedVideoBeenViewed;

    if (!hasViewed) {
        
        if (isFeatured) {
            setHasFeaturedVideoBeenViewed(true);
        } else {
            setHasSelectedVideoBeenViewed(true);
        }

        await handleViewCountUpdate(id, contentType);
        
        if (isUserLoggedIn) {
            await handleHistoryUpdate(id);
        }
    }
    }, [featuredVideo, hasFeaturedVideoBeenViewed, hasSelectedVideoBeenViewed, selectedVideo, setFeaturedVideo, setHasFeaturedVideoBeenViewed, setHasSelectedVideoBeenViewed, setVideos, videos, isUserLoggedIn, handleViewCountUpdate, handleHistoryUpdate]);

    const fetchVideoById = useCallback(async (id: string) => {
        try {
            let response;
            let videoType = activeNavItem.toLowerCase().replace(/s$/, "");
            const navItem = searchParamsHook?.get('activeNavItem');

            if (navItem) {
                videoType = navItem.toLowerCase().replace(/s$/, "");
            }

            const url = `/api/videos/${id}${videoType !== "video" ? `?type=${videoType}` : ""}`;
            response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch video");
            }

            const data = await response.json();

            setSelectedVideo({
                ...data,
                videoUrl: data.videoUrl || data.filePath,
                thumbnailUrl: data.thumbnailUrl || data.featureImageUrl,
                commentCount: data.commentCount,
                eventImageUrls: data.eventImageUrls || [],
            });

            setSelectedVideoSubscriberCount(getStoredSubscriberCount(data.channel) || data.subscriberCount || 0);
            handleVideoView(id, false);
            fetchComments(id);
            setHasSelectedVideoBeenViewed(false);
        } catch (error) {
            console.error("Error fetching video:", error);
            toast.error(`Failed to load video. ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }, [activeNavItem, searchParamsHook, handleVideoView, fetchComments]);

    const handleNavItemChange = (navItem: string) => {
        setActiveNavItem(navItem);
        setSelectedVideo(null);
        const newUrl = navItem === 'All' ? '/' : `/?activeNavItem=${navItem}`;
        router.push(newUrl, { scroll: false });
    };

    useEffect(() => {
        const navItem = searchParamsHook?.get('activeNavItem');
        const videoIdPromise = params;

        videoIdPromise.then(params => {
            const { videoId } = params;
            if (videoId) {
                if (navItem) {
                    setActiveNavItem(navItem);
                }
                fetchVideoById(videoId);
            } else if (navItem) {
                setActiveNavItem(navItem);
                setSelectedVideo(null);
            }
        });
    }, [searchParamsHook, params]);

    useEffect(() => {
        const handleKeyDownCapture = (event: KeyboardEvent) => {
            event.stopPropagation();
        };

        document.addEventListener('keydown', handleKeyDownCapture, { capture: true });

        return () => {
            document.removeEventListener('keydown', handleKeyDownCapture, { capture: true });
        };
    }, []);

    const handleUpNextVideoClick = useCallback((item: Content) => {
        try {
            let response;
            let navItem = 'videos';
            let videoId = item._id;
            const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            if (item.type === 'webinar') {
                if (item._id.startsWith('webinar')) {
                    videoId = item._id.replace('webinar', '');
                }
                response = fetch(`/api/videos/${videoId}?type=webinar`);
                navItem = 'webinars';
            } else if (item.type === 'podcast') {
                response = fetch(`/api/videos/${videoId}?type=podcast`);
                navItem = 'podcasts';
            } else if (item.type === 'testimonial') {
                response = fetch(`/api/videos/${videoId}?type=testimonial`);
                navItem = 'testimonials';
            } else if (item.type === 'demo') {
                response = fetch(`/api/videos/${videoId}?type=demo`);
                navItem = 'demos';
            } else if (item.type === 'event') {
                response = fetch(`/api/videos/${videoId}?type=event`);
                navItem = 'events';
            } else {
                response = fetch(`/api/videos/${item._id}?type=video`);
            }

            response.then(async (res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch video');
                }
                const data = await res.json();
                if (data.type === 'podcast' || data.type === 'testimonial' || data.type === 'demo' || data.type === 'event') {
                    setSelectedVideo({ ...data, videoUrl: data.filePath, thumbnailUrl: data.featureImageUrl, commentCount: data.commentCount } as Video);
                } else {
                    setSelectedVideo({ ...data, commentCount: data.commentCount } as Video);
                }
                setSelectedVideoSubscriberCount(getStoredSubscriberCount(data.channel) || data.subscriberCount || 0);
                fetchComments(videoId);
                router.push(`/${navItem}/${videoId}/${slug}`, { scroll: false });
                handleVideoView(videoId, false);
                setHasSelectedVideoBeenViewed(false);
            }).catch((error) => {
                console.error('Error fetching video:', error);
                toast.error('Failed to load video');
            });

        } catch (error) {
            console.error('Error fetching video:', error);
            toast.error('Failed to load video');
        }
    }, [fetchComments, handleVideoView, router]);

    useEffect(() => {
        if (selectedVideo) {
        }
    }, [selectedVideo]);

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const handleFeaturedVideoView = useCallback(async () => {
        if (featuredVideo) {
            await handleVideoView(featuredVideo._id, true);
        }
    }, [featuredVideo, handleVideoView]);

    const handleSelectedVideoView = useCallback(async () => {
        if (selectedVideo) {
            await handleVideoView(selectedVideo._id, false);
        }
    }, [handleVideoView, selectedVideo]);

    useEffect(() => {
        if (selectedVideo) {
            const updatedVideo = videos?.find(v => v._id === selectedVideo._id);
            if (updatedVideo) {
                setSelectedVideo(updatedVideo);
                localStorage.setItem(`video-${updatedVideo._id}-state`, JSON.stringify({
                    likedBy: updatedVideo.likedBy,
                    dislikedBy: updatedVideo.dislikedBy
                }));
            }
        }
    }, [videos, selectedVideo?._id]);

    const isVideoLiked = (video?: Video | null): boolean => {
        if (!session?.user?.id || !video) return false;
        return video.likedBy?.includes(session.user.id) || false;
    };

    const isVideoDisliked = (video?: Video | null): boolean => {
        if (!session?.user?.id || !video) return false;
        return video.dislikedBy?.includes(session.user.id) || false;
    };

    const handleLike = async (videoId: string) => {
        if (!session?.user?.id) {
            toast.error("Please sign in to like videos", { position: 'top-right' });
            return;
        }
        try {
            const response = await fetch(`/api/videos/${videoId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to like video');
            }
            const data = await response.json();
            updateVideoState(videoId, data);
        } catch (error) {
            toast.error("An error occurred while liking the video.", { position: 'top-right' });
        }
    };

    const handleDislike = async (videoId: string) => {
        if (!session?.user?.id) {
            toast.error("Please sign in to dislike videos", { position: 'top-right' });
            return;
        }
        try {
            const response = await fetch(`/api/videos/${videoId}/dislike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to dislike video');
            }
            const data = await response.json();
            updateVideoState(videoId, data);
        } catch (error) {
            toast.error("An error occurred while disliking the video.", { position: 'top-right' });
        }
    };

    const handleCommentSubmit = async (videoId: string) => {
        if (!isUserLoggedIn || !session?.user?.id || !session?.user?.name) {
            toast.info('Please sign in to add a comment.', { position: 'top-right' });
            router.push('/signin');
            return;
        }
        try {
            const response = await fetch(`/api/videos/${videoId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'user-id': session.user.id as string,
                    'username': session.user.name,
                },
                body: JSON.stringify({ content: newComment }),
            });
            if (!response.ok) throw new Error('Failed to submit comment');
            const data = await response.json();
            setComments(prevComments => [data, ...prevComments]);
            await fetchComments(videoId);

            const updatedVideoResponse = await fetch(`/api/videos/${videoId}`);
            if (!updatedVideoResponse.ok) {
                throw new Error('Failed to fetch updated video');
            }
            const updatedVideoData = await updatedVideoResponse.json();

            if (videos) {
                setVideos(prevVideos =>
                    prevVideos.map(video =>
                        video._id === videoId ? { ...video, commentCount: updatedVideoData.commentCount } : video
                    )
                );
            }

            setSelectedVideo(prevVideo => {
                return prevVideo ? { ...prevVideo, commentCount: updatedVideoData.commentCount } : null;
            });

            if (featuredVideo && featuredVideo._id === videoId) {
                setFeaturedVideo(prev => {
                    if (prev) {
                        return { ...prev, commentCount: updatedVideoData.commentCount };
                    }
                    return prev;
                });
            }

            setNewComment('');
            toast.success("Comment submitted!", { position: 'top-right' });
        } catch (error) {
            console.error('Error submitting comment:', error);
            toast.error("An error occurred while submitting the comment.", {
                position: 'top-right',
            });
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleToggleVideo = useCallback(() => {
        if (videoPlayerRef.current) {
            videoPlayerRef.current.toggle();
        }
    }, [videoPlayerRef]);

    const handleDashboardRedirect = () => {
        if (isAdmin) {
            router.push('/admin/channels');
        } else {
            router.push('/dashboard');
        }
    }

    const navItems = ['All', 'Videos', 'Blogs', 'Webinars', 'Podcasts', 'Case-Studies', 'Info-graphics', 'White-papers', 'Testimonials', 'E-books', 'Demos', 'Events'];

    const renderHeader = () => (
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
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/profile')}>
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings')}>
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleLogout}>
                                    Logout
                                </DropdownMenuItem>
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

    const renderContent = () => {
        if (videoId) {
            return (
                <div className='flex flex-col md:flex-row gap-4' id='video-player-container'>
                    <div className="flex-1">
                        {selectedVideo && (
                            <FeaturedVideoCard
                                featuredVideo={selectedVideo}
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
                                subscriberCount={selectedVideo.subscriberCount || selectedVideoSubscriberCount}
                                comments={comments}
                                setComments={setComments}
                                commentCount={selectedVideo?.commentCount || 0}
                                key={selectedVideo?._id}
                                updateVideoState={updateVideoState}
                            />
                        )}
                        {selectedVideo && selectedVideo?.type === 'event' && selectedVideo.eventImageUrls && selectedVideo.eventImageUrls.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">Event Gallery</h3>
                                <div
                                    className="relative overflow-x-auto snap-x snap-mandatory md:overflow-x-visible md:w-full md:snap-none"
                                    ref={imageGalleryRef}
                                >
                                    <div className="flex gap-4 pb-2 md:justify-start">
                                        {selectedVideo.eventImageUrls.map((imageUrl, index) => (
                                            <div
                                                key={index}
                                                className="inline-block relative w-28 h-20 rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 hover:ring-1 ring-primary snap-start shrink-0 md:shrink"
                                                onClick={() => {
                                                    setLightboxInitialIndex(index);
                                                    setIsLightboxOpen(true);
                                                }}
                                                style={{ scrollSnapAlign: 'start' }}
                                            >
                                                <Image
                                                    src={imageUrl || "/placeholder.svg"}
                                                    alt={`Event image ${index + 1}`}
                                                    fill
                                                    className="object-cover rounded-lg"
                                                    sizes="(max-width: 768px) 140px, 140px"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <ImageLightbox
                                    images={selectedVideo.eventImageUrls}
                                    initialIndex={lightboxInitialIndex}
                                    isOpen={isLightboxOpen}
                                    onClose={() => setIsLightboxOpen(false)}
                                />
                            </div>
                        )}
                        {selectedVideo && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">{selectedVideo?.commentCount || 0} Comments</h3>
                                    <Button
                                        variant="default"
                                        className="bg-[#3E3EFF] hover:bg-[#3232CC] text-white rounded-full px-6"
                                        onClick={() => setIsCommentInputVisible(true)}
                                    >
                                        Comment
                                    </Button>
                                </div>
                                {isCommentInputVisible && (
                                    <div className="flex gap-4 mb-6">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={session?.user?.image || "/placeholder-user.jpg"} alt="Your avatar" />
                                            <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-4">
                                            <Textarea
                                                placeholder="Add a comment..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="min-h-[80px] resize-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setIsCommentInputVisible(false);
                                                        setNewComment('');
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    className="bg-[#3E3EFF] hover:bg-[#3232CC] text-white"
                                                    onClick={() => {
                                                        if (selectedVideo) {
                                                            handleCommentSubmit(selectedVideo._id);
                                                            setIsCommentInputVisible(false);
                                                        }
                                                    }}
                                                    disabled={!newComment.trim()}
                                                >
                                                    Comment
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <Suspense fallback={<div>Loading Comments...</div>}>
                                    <CommentSection
                                        commentCount={selectedVideo?.commentCount || 0}
                                        comments={comments}
                                        videoId={selectedVideo?._id}
                                        setComments={setComments}
                                    />
                                </Suspense>
                            </div>
                        )}
                    </div>
                    <div className="w-full md:w-80">
                        <h3 className="text-lg font-semibold mb-2">Up Next</h3>
                        <Suspense fallback={<div>Loading Up Next...</div>}>
                            <UpNextList
                                videos={upNextVideos}
                                onVideoClick={handleUpNextVideoClick}
                                formatDuration={formatDuration}
                            />
                        </Suspense>
                    </div>
                </div>
            );
        }

        switch (activeNavItem) {
            case 'Videos':
                return (
                    <Suspense fallback={<div>Loading Videos...</div>}>
                        <VideoList
                            videos={videos || []}
                            onVideoClick={handleUpNextVideoClick}
                            formatDuration={formatDuration}
                        />
                    </Suspense>
                );

            case 'Webinars':
                return (
                    <Suspense fallback={<div>Loading Webinars...</div>}>
                        <VideoList
                            videos={webinars || []}
                            onVideoClick={handleUpNextVideoClick}
                            formatDuration={formatDuration}
                        />
                    </Suspense>
                );

            case 'Podcasts':
                return (
                    <Suspense fallback={<div>Loading Podcasts...</div>}>
                        <VideoList
                            videos={podcasts || []}
                            onVideoClick={handleUpNextVideoClick}
                            formatDuration={formatDuration}
                        />
                    </Suspense>
                );

            case 'Testimonials':
                return (
                    <Suspense fallback={<div>Loading Testimonials...</div>}>
                        <VideoList
                            videos={testimonials || []}
                            onVideoClick={handleUpNextVideoClick}
                            formatDuration={formatDuration}
                        />
                    </Suspense>
                );

            case 'Demos':
                return (
                    <Suspense fallback={<div>Loading Demos...</div>}>
                        <VideoList
                            videos={demos || []}
                            onVideoClick={handleUpNextVideoClick}
                            formatDuration={formatDuration}
                        />
                    </Suspense>
                );

            case 'Events':
                return (
                    <Suspense fallback={<div>Loading Events...</div>}>
                        <VideoList
                            videos={events || []}
                            onVideoClick={handleUpNextVideoClick}
                            formatDuration={formatDuration}
                        />
                    </Suspense>
                );

            case 'Blogs':
                if (!blogPosts || blogPosts.length === 0) {
                    return <div>No blog posts available</div>;
                }
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 p-6 grid-auto-flow-dense">
                        {interweavedPosts.map((post, index) => {
                            if (!post) {
                                return <div key={index} className="hidden lg:block" />;
                            }
                            return (
                                <BlogPostCard
                                    key={post._id}
                                    post={post}
                                    handleSelectedVideoSubscriberCountChange={handleSelectedVideoSubscriberCountChange}
                                />
                            );
                        })}
                    </div>
                );

            case 'Tech News':
                if (isTechNewsLoading) {
                    return <div>Loading Tech News...</div>;
                }
                if (techNewsError) {
                    return <div>Error loading Tech News: {techNewsError}</div>;
                }
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                        {techNews.map((newsItem) => (
                            <Link href={`/tech-news/${newsItem.slug}`} key={newsItem._id}>
                                <Card className="cursor-pointer hover:shadow-md transition-shadow border-none mt-6 bg-gray-50">
                                    <CardContent className="p-2 flex items-center space-x-4">
                                        <Image
                                            src={newsItem.featuredImage || "/placeholder.svg"}
                                            alt={newsItem.title}
                                            width={80}
                                            height={80}
                                            className="rounded w-[60px] h-auto object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            loading='lazy'
                                        />
                                        <div className="w-3/4 font-normal text-xs text-gray-600">
                                            {formatDistanceToNow(new Date(newsItem.createdAt))} ago
                                            <h3 className="font-semibold text-xs text-black line-clamp-2">
                                                {newsItem.title}
                                            </h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                );

            case 'Info-graphics':
            case 'White-papers':
            case 'E-books':
            case 'Case-Studies':
                return (
                    <Suspense fallback={<div>Loading Documents...</div>}>
                        <PDFGrid
                            documents={pdfDocuments.filter(doc =>
                                doc.type === activeNavItem.toLowerCase().replace(/[-\s]/g, '')
                            )}
                            category={activeNavItem}
                        />
                    </Suspense>
                );

            default:
                return (
                    <div className="flex flex-col md:flex-row md:space-x-8">
                        <div className="flex-1">
                            {featuredVideo && (
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
                                    subscriberCount={featuredVideo.subscriberCount || featuredVideoSubscriberCount}
                                    comments={comments}
                                    setComments={setComments}
                                    commentCount={featuredVideo?.commentCount || 0}
                                    key={featuredVideo?._id}
                                    updateVideoState={updateVideoState}
                                />
                            )}
                            {featuredVideo && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">{featuredVideo?.commentCount || 0} Comments</h3>
                                        <Button
                                            variant="default"
                                            className="bg-[#2A2FB8] text-white text-xs font-medium px-6 py-2 rounded-full h-8"
                                            onClick={() => setIsCommentInputVisible(true)}
                                        >
                                            Comment
                                        </Button>
                                    </div>
                                    {isCommentInputVisible && (
                                        <div className="flex gap-4 mb-6">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={session?.user?.image || "/placeholder-user.jpg"} alt="Your avatar" />
                                                <AvatarFallback>{session?.user?.name?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-4">
                                                <Textarea
                                                    placeholder="Add a comment..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    className="min-h-[80px] resize-none"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setIsCommentInputVisible(false);
                                                            setNewComment('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        className="bg-[#3E3EFF] hover:bg-[#3232CC] text-white"
                                                        onClick={() => {
                                                            if (featuredVideo) {
                                                                handleCommentSubmit(featuredVideo._id);
                                                                setIsCommentInputVisible(false);
                                                            }
                                                        }}
                                                        disabled={!newComment.trim()}
                                                    >
                                                        Comment
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {featuredVideo && (
                                        <Suspense fallback={<div>Loading Comments...</div>}>
                                            <CommentSection
                                                commentCount={featuredVideo.commentCount || 0}
                                                comments={comments}
                                                videoId={featuredVideo._id}
                                                setComments={setComments}
                                            />
                                        </Suspense>
                                    )}
                                </div>
                            )}
                            <div className="mb-4">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold">Most Popular Blogs</h2>
    <Button
      variant="default"
      className="bg-[#2A2FB8] text-white text-xs font-medium rounded-full px-4 py-1 h-8"
      onClick={() => handleNavItemChange('Blogs')}
    >
      View all
    </Button>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
    {popularBlogs.map((post) => (
      <Link href={`/blog/posts/${post.slug}`} key={post._id}>
        <Card className="flex items-center p-4 h-[120px] w-full">
          {/* Thumbnail */}
          <div className="w-24 h-24 relative flex-shrink-0 rounded overflow-hidden mr-4">
            <Image
              src={post.featuredImage || "/placeholder.svg"}
              alt={post.title}
              fill
              className="object-cover rounded"
              loading="lazy"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col justify-between flex-1 h-full overflow-hidden">
            <h3 className="font-semibold text-sm line-clamp-2">{post.title}</h3>

            <div className="flex items-center space-x-2 mt-auto">
              <Button variant="ghost" size="icon">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
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
    <Button
      variant="default"
      className="bg-[#2A2FB8] text-white text-xs font-medium rounded-full px-4 py-1 h-8"
      onClick={() => handleNavItemChange('Webinars')}
    >
      View all
    </Button>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
    {popularWebinarVideos.map((video) => (
      <Card
        key={video._id}
        className="flex items-center p-4 h-[120px] w-full cursor-pointer hover:shadow-md transition-shadow border-none bg-gray-50"
        onClick={() => handleWebinarClick(video)}
      >
        {/* Thumbnail */}
        <div className="w-24 h-24 relative flex-shrink-0 rounded overflow-hidden mr-4">
          <Image
            src={video.thumbnailUrl || "/placeholder.svg"}
            alt={video.title}
            fill
            className="object-cover rounded"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between flex-1 h-full overflow-hidden">
          <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>

          <div className="flex items-center space-x-2 mt-auto">
            <Button variant="ghost" size="icon">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    ))}
  </div>
</div>

                           <div className="mb-4">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold">Most Popular Events</h2>
    <Button
      variant="default"
      className="bg-[#2A2FB8] text-white text-xs font-medium rounded-full px-4 py-1 h-8"
      onClick={() => handleNavItemChange('Events')}
    >
      View all
    </Button>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
    {popularEventVideos.map((video) => (
      <Card
        key={video._id}
        className="flex items-center p-4 h-[120px] w-full cursor-pointer hover:shadow-md transition-shadow border-none bg-gray-50"
        onClick={() => handleEventClick(video)}
      >
        {/* Thumbnail */}
        <div className="w-24 h-24 relative flex-shrink-0 rounded overflow-hidden mr-4">
          <Image
            src={video.thumbnailUrl || "/placeholder.svg"}
            alt={video.title}
            fill
            className="object-cover rounded"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between flex-1 h-full overflow-hidden">
          <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>

          <div className="flex items-center space-x-2 mt-auto">
            <Button variant="ghost" size="icon">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    ))}
  </div>
</div>

                        </div>
                        <aside className="w-full md:w-64 mt-8 md:mt-0 flex flex-col space-y-8 rounded-lg right-0 p-4 w-64 bg-white">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Up Next</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                                    <Suspense fallback={<div>Loading Up Next...</div>}>
                                        <UpNextList
                                            videos={upNextVideos}
                                            onVideoClick={handleUpNextVideoClick}
                                            formatDuration={formatDuration}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Tech News</h2>
                                {techNews && techNews.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                                        {techNews.map((newsItem) => (
                                            <Link key={newsItem._id} href={`/tech-news/${newsItem.slug}`}>
                                                <Card className="cursor-pointer hover:shadow-md transition-shadow border-none mt-6 bg-gray-50">
                                                    <CardContent className="p-2 flex items-center space-x-4">
                                                        <Image
                                                            src={newsItem.featuredImage || "/placeholder.svg"}
                                                            alt={newsItem.title}
                                                            width={80}
                                                            height={80}
                                                            className="rounded w-[80px] h-auto object-cover"
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                            loading='lazy'
                                                        />
                                                        <div className="w-3/4 font-normal text-xs text-gray-600">
                                                            {format(new Date(newsItem.createdAt), ' dd MMMM yyyy')}
                                                            <h3 className="font-semibold text-xs text-black line-clamp-2">
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
                        </aside>
                    </div>
                );
        }
    };

    useEffect(() => {
        const fetchVideoId = async () => {
            const resolvedParams = await params;
            setVideoId(resolvedParams.videoId);
        };
        fetchVideoId();
    }, [params]);

    useEffect(() => {
        if (isUserLoggedIn) {
            const userSession = {
                isLoggedIn: true,
                lastActive: new Date().toISOString(),
                type: 'admin'
            };
            sessionStorage.setItem('userSession', JSON.stringify(userSession));
            sessionStorage.setItem('token', localStorage.getItem('token') || "");
        } else {
            sessionStorage.removeItem('userSession');
            sessionStorage.removeItem('token');
        }
    }, [isUserLoggedIn]);

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
                <main className="flex-1 overflow-y-auto p-4">
                    {renderContent()}
                </main>
            </div>
            <ToastContainer position='top-right' />
        </div>
    );
}

export default Home
