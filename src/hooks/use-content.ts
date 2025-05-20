// src/hooks/use-content.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import type { Video, BlogPost, PDFDocument, Content, TechNews } from '@/types/common';

type ContentType = Video | BlogPost | PDFDocument | TechNews;

export function useContent() {
    const { data: session } = useSession();
    const [likedContent, setLikedContent] = useState<Content[]>([]);
    const [dislikedContent, setDislikedContent] = useState<Content[]>([]);
    const [savedContent, setSavedContent] = useState<Content[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserContent = async () => {
            if (!session?.user?.id) {
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                const response = await fetch(`/api/users/${session.user.id}/content`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user content');
                }
                const data = await response.json();
                setLikedContent(data.liked || []);
                setDislikedContent(data.disliked || []);
                setSavedContent(data.saved || []);
            } catch (error) {
                console.error('Error fetching user content:', error);
                toast.error('Failed to fetch user content');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserContent();
    }, [session]);

    const removeLike = async (contentId: string) => {
        try {
            const response = await fetch(`/api/users/${session?.user?.id}/content/like`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId }),
            });

            if (!response.ok) throw new Error('Failed to remove like');
            setLikedContent((prev) => prev.filter((item: Content) => item._id !== contentId));
            toast.success('Removed from liked');
        } catch (error) {
            console.error('Error removing like:', error);
            toast.error('Failed to remove from liked');
        }
    };

    const removeDislike = async (contentId: string) => {
        try {
            const response = await fetch(`/api/users/${session?.user?.id}/content/dislike`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId }),
            });

            if (!response.ok) throw new Error('Failed to remove dislike');

            setDislikedContent((prev) => prev.filter((item: Content) => item._id !== contentId));
            toast.success('Removed from disliked');
        } catch (error) {
            console.error('Error removing dislike:', error);
            toast.error('Failed to remove from disliked');
        }
    };

    const removeSaved = async (contentId: string) => {
        try {
            const itemToRemove = savedContent.find(item => item._id === contentId);

            if (!itemToRemove) {
                console.warn("Item to remove not found in savedContent:", contentId);
                return; // Or throw an error, depending on your desired behavior
            }

            const isTechNews = itemToRemove.type === 'technews';
            const isBlogPost = itemToRemove.type === 'blogpost';
            const isPdf = itemToRemove.type === 'pdf';

            const response = await fetch(`/api/users/save`, { //keep the endpoint same to reuse logic
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session?.user?.id,
                    techNewsId: isTechNews ? contentId : null,
                    postId: isBlogPost ? contentId : null,
                    pdfId: isPdf ? contentId : null
                }),
            });

            if (!response.ok) throw new Error('Failed to remove saved content');

            setSavedContent((prev) => prev.filter((item: Content) => item._id !== contentId));
            toast.success('Removed from saved');
        } catch (error) {
            console.error('Error removing saved content:', error);
            toast.error('Failed to remove from saved');
        }
    };

    return {
        likedContent,
        dislikedContent,
        savedContent,
        isLoading,
        removeLike,
        removeDislike,
        removeSaved,
    };
}