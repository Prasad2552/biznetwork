import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { toast } from 'react-toastify';
import { Video } from '@/types/common';

// Replace with your actual Comment type definition
interface Comment {
    _id: string;
    videoId: string;
    userId: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

interface UseVideosReturn {
    videos: Video[];
    webinars: Video[];
    podcasts: Video[];
    testimonials: Video[];
    demos: Video[];
    events: Video[];
    featuredVideo: Video | null;
    upNextVideos: Video[];
    isLoading: boolean;
    error: string | null;
    updateVideoState: (videoId: string, data: Partial<Video>) => void;
    setFeaturedVideo: Dispatch<SetStateAction<Video | null>>;
    setVideos: Dispatch<SetStateAction<Video[]>>;
    featuredVideoComments: Comment[];
    setFeaturedVideoComments: Dispatch<SetStateAction<Comment[]>>;
}

export const useVideos = (): UseVideosReturn => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [webinars, setWebinars] = useState<Video[]>([]);
    const [podcasts, setPodcasts] = useState<Video[]>([]);
    const [testimonials, setTestimonials] = useState<Video[]>([]);
    const [demos, setDemos] = useState<Video[]>([]);
    const [events, setEvents] = useState<Video[]>([]);
    const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
    const [upNextVideos, setUpNextVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [featuredVideoComments, setFeaturedVideoComments] = useState<Comment[]>([]);

    const fetchComments = async (videoId: string) => {
        try {
            const response = await fetch(`/api/videos/${videoId}/comments`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            const data: Comment[] = await response.json();
            setFeaturedVideoComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error("Failed to fetch comments.", {
                position: 'top-right',
            });
        }
    };

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/videos/display');
                if (response.ok) {
                    const data: Video[] = await response.json();
                    const videosWithArrays = data.map((video: Video) => ({
                        ...video,
                        commentCount: video.comments?.length || 0,
                        likedBy: video.likedBy || [],
                        dislikedBy: video.dislikedBy || []
                    }));

                    setVideos(videosWithArrays.filter((item: Video) => item.type === 'video'));
                    setWebinars(videosWithArrays.filter((item: Video) => item.type === 'webinar'));
                    setPodcasts(videosWithArrays.filter((item: Video) => item.type === 'podcast'));
                    setTestimonials(videosWithArrays.filter((item: Video) => item.type === 'testimonial'));
                    setDemos(videosWithArrays.filter((item: Video) => item.type === 'demo'));
                    setEvents(videosWithArrays.filter((item: Video) => item.type === 'event'));
                    setUpNextVideos(videosWithArrays.slice(0, 5));

                    const featured = videosWithArrays.find((video: Video) => video._id === '679262c019bb7b22e4061443');
                    if (featured) {
                        setFeaturedVideo(featured);
                        fetchComments(featured._id);
                    }
                } else {
                    console.error('Failed to fetch videos');
                    setError('Failed to load videos');
                    toast.error('Failed to fetch videos. Please try again.', { position: 'top-right' });
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
                setError('Failed to load videos');
                toast.error('An error occurred while fetching videos. Please try again.', { position: 'top-right' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const updateVideoState = (videoId: string, data: Partial<Video>) => {
        setVideos(prevVideos =>
            prevVideos.map((video: Video) =>
                video._id === videoId ? { ...video, ...data } : video
            )
        );
        setWebinars(prevVideos =>
            prevVideos.map((video: Video) =>
                video._id === videoId ? { ...video, ...data } : video
            )
        );
        setPodcasts(prevVideos =>
            prevVideos.map((video: Video) =>
                video._id === videoId ? { ...video, ...data } : video
            )
        );
        setTestimonials(prevVideos =>
            prevVideos.map((video: Video) =>
                video._id === videoId ? { ...video, ...data } : video
            )
        );
        setDemos(prevVideos =>
            prevVideos.map((video: Video) =>
                video._id === videoId ? { ...video, ...data } : video
            )
        );
        setEvents(prevVideos =>
            prevVideos.map((video: Video) =>
                video._id === videoId ? { ...video, ...data } : video
            )
        );

        if (featuredVideo && featuredVideo._id === videoId) {
            setFeaturedVideo(prevVideo => prevVideo ? { ...prevVideo, ...data } : null);
        }
    };

    const setFeaturedVideoWithCommentCount = (video: SetStateAction<Video | null>) => {
        setFeaturedVideo(video);
    };

    const setVideosWithCommentCount = (updatedVideo: SetStateAction<Video[]>) => {
        setVideos(updatedVideo);
    };

    return {
        videos,
        webinars,
        podcasts,
        testimonials,
        demos,
        events,
        featuredVideo,
        upNextVideos,
        isLoading,
        error,
        updateVideoState,
        setFeaturedVideo: setFeaturedVideoWithCommentCount,
        setVideos: setVideosWithCommentCount,
        featuredVideoComments,
        setFeaturedVideoComments
    };
};