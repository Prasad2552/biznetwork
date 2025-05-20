// src/hooks/useTechNews.ts
import { useState, useEffect } from 'react';
import { TechNews } from '@/types/common'; // Replace with your actual TechNews type
import { toast } from "react-toastify";

export const useTechNews = () => {
    const [techNews, setTechNews] = useState<TechNews[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTechNews = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/tech-news'); // Replace with your API endpoint
                if (!response.ok) {
                    const errorData = await response.json();
                   const errorMessage = errorData?.error || response.statusText;
                   throw new Error(`Failed to fetch Tech News: ${errorMessage}`);

                }
                const data = await response.json();
                setTechNews(data);
            } catch (error) {
                console.error('Error fetching Tech News:', error);
                setError("Failed to fetch tech news. Please try again.");
                toast.error(`An error occurred while fetching tech news. Please try again.`, {
                    position: 'top-right',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTechNews();
    }, []);

    return { techNews, isLoading, error };
};