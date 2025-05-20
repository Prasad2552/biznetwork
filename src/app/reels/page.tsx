// src/app/all-shorts/page.tsx
"use client"

import React, { useState, useEffect } from 'react';
import ShortsGrid from "@/components/ShortsGrid";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from '@/components/sidebar'; // Import Sidebar
import { useAuthCheck } from '@/hooks/useAuthCheck'; // Import useAuthCheck

interface Short {
    _id: string;
    title: string;
    videoUrl: string;
    channelId: string;
    channel: {
        name: string;
        logo: string;
    };
    thumbnailUrl: string;
    views: number;
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
}

export default function AllShortsPage() {
    const [shorts, setShorts] = useState<Short[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token, isUserLoggedIn, isAdmin, handleLogout } = useAuthCheck(); // Use auth check
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar state
    const [activeSidebarItem, setActiveSidebarItem] = useState('All Shorts'); // Active sidebar item
    // const [activeNavItem, setActiveNavItem] = useState("All");

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        const fetchShorts = async () => {
            try {
                const response = await fetch("/api/shorts"); // Fetch shorts from your API
                if (!response.ok) {
                    throw new Error('Failed to fetch shorts');
                }
                const data = await response.json();
                setShorts(data.shorts);
            } catch (error) {
                console.error("Error fetching shorts:", error);
                setShorts([]); // Set an empty array in case of an error
            } finally {
                setIsLoading(false);
            }
        };
        fetchShorts();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
          <Sidebar
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              activeSidebarItem={activeSidebarItem}
              setActiveSidebarItem={setActiveSidebarItem}
              token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
          />
            <div className="flex-1 flex flex-col w-full">
               
                <main className="flex-1 overflow-y-auto p-4">
                    <div className="container mx-auto py-8">
                        <h1 className="text-2xl font-bold mb-4">All Shorts</h1>
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Skeleton key={i} className="h-64 rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <ShortsGrid shorts={shorts} />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}