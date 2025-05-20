import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

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

interface UseBlogPostsReturn {
    blogPosts: BlogPost[];
    popularBlogs: BlogPost[];
    isLoading: boolean;
    error: string | null;
}

export const useBlogPosts = (): UseBlogPostsReturn => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [popularBlogs, setPopularBlogs] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlogPosts = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog/posts`);
                if (!response.ok) {
                    throw new Error('Failed to fetch blog posts');
                }
                const data = await response.json();

                if (data && data.posts && Array.isArray(data.posts)) {
                    const posts = data.posts.map((post: BlogPost) => ({
                        ...post,
                        tags: post.tags || [],
                    }));
                    setBlogPosts(posts);
                    setPopularBlogs(posts.slice(0, 2));
                } else {
                     console.error("Invalid data format received from /api/blog/posts:", data);
                      setError('Invalid blog post format');
                      toast.error('Invalid blog post format. Please try again.', { position: 'top-right' });
                }
            } catch (error) {
                console.error('Error fetching blog posts:', error);
                 setError('Failed to load blog posts');
                 toast.error('An error occurred while fetching blog posts. Please try again.', { position: 'top-right' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlogPosts();
    }, []);

    return { blogPosts, popularBlogs, isLoading, error };
};