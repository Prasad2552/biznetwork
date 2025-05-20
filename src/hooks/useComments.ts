import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Comment {
    _id: string;
    userId: string;
    username: string;
    content: string;
    likes: number;
    dislikes: number;
    createdAt: string;
    replies: Comment[];
     likedBy?: string[];
    dislikedBy?: string[];
}

interface UseCommentsReturn {
    comments: Comment[];
    loadingComments: boolean;
    commentError: string | null;
    fetchComments: (videoId: string) => Promise<void>;
    setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

export const useComments = (): UseCommentsReturn => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);
     const [token, setToken] = useState<string | null>(null);

     useEffect(() => {
        const storedToken = sessionStorage.getItem('token');
         if (storedToken) {
            setToken(storedToken);
        } else {
            setToken(null);
        }
    }, []);

    const fetchComments = async (videoId: string) => {
        try {
            setLoadingComments(true);
            setCommentError(null);
            const response = await fetch(`/api/videos/${videoId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch comments');
            const data = await response.json();
            setComments(data.comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setCommentError('Failed to load comments. Please try again.');
            toast.error("An error occurred while fetching the comments.", { position: 'top-right' });
        } finally {
            setLoadingComments(false);
        }
    };

    return { comments, loadingComments, commentError, fetchComments, setComments };
};