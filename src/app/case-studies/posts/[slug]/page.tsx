// src\app\case-studies\posts\[slug]\page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft} from 'lucide-react';
import { useAuthCheck } from '@/hooks/useAuthCheck'; // Import useAuthCheck
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import { toast } from 'react-toastify';


interface CaseStudyPost {
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
    status?: string;
    likes?: number;
    dislikes?: number;
    likeBy?: string[];
    dislikeBy?: string[];
}

interface Params {
    slug?: string;
    [key: string]: string | string[] | undefined;
}

const CaseStudyPostPage: React.FC = () => {
    const router = useRouter();
    const params = useParams<Params>();
    const slug = params?.slug;
    const [caseStudyPost, setCaseStudyPost] = useState<CaseStudyPost | null>(null);
    const [hasLiked, setHasLiked] = useState(false);
    const [hasDisliked, setHasDisliked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isUserLoggedIn, handleLogout, token } = useAuthCheck(); // Use useAuthCheck
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSidebarItem, setActiveSidebarItem] = useState('Contact Us');
    const [activeNavItem, setActiveNavItem] = useState('All');
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
     const [user, setUser] = useState<any>(null);
     


    const sidebarItems = [
        { name: 'Publish With Us', href: '/publish' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'Help', href: '/help' },
        { name: 'Send Feedback', href: '/feedback' },
    ];

    // Function to decode HTML entities
    const decodeHTMLEntities = (text: string) => {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    };

    // Function to fetch content from a URL
     const fetchContentFromURL = async (url: string) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch content from URL: ${url}`);
            }
            return await response.text();
        } catch (error: any) {
            console.error('Error fetching content from URL:', error);
            setError(error.message || 'An error occurred while fetching content from URL');
            return null;
        }
    };


    useEffect(() => {
         const fetchUser = async () => {
             if (isUserLoggedIn && token) {
                try {
                  const response = await fetch('/api/auth/user', {
                   headers: {
                     Authorization: `Bearer ${token}`,
                   },
                  });
                    if(response.ok){
                         const userData = await response.json();
                       setUser(userData)
                    } else {
                          console.error('Failed to fetch user data', response)
                           setUser(null);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                     setUser(null);
                }
           } else{
                setUser(null);
           }

         }

          fetchUser();

    }, [isUserLoggedIn, token]);


    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) {
                setError('No slug provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/case-study/posts/${slug}`);
                const data = await response.json();


                if (!response.ok) {
                     throw new Error(data.error || 'Failed to fetch case study');
                }

                // Check if content is a URL
                if (data.content && typeof data.content === 'string' && data.content.startsWith('http')) {
                      const fetchedContent = await fetchContentFromURL(data.content);
                       if(fetchedContent){
                           const formattedData = {
                              ...data,
                                content: fetchedContent,
                                };
                                setCaseStudyPost(formattedData);
                                 if (isUserLoggedIn && user && formattedData.likeBy) {
                                        setHasLiked(formattedData.likeBy.includes(user._id));
                                 }
                                if (isUserLoggedIn && user && formattedData.dislikeBy) {
                                        setHasDisliked(formattedData.dislikeBy.includes(user._id));
                                  }
                       } else {
                             setCaseStudyPost(data);
                            if (isUserLoggedIn && user && data.likeBy) {
                                    setHasLiked(data.likeBy.includes(user._id));
                                }
                                 if (isUserLoggedIn && user && data.dislikeBy) {
                                    setHasDisliked(data.dislikeBy.includes(user._id));
                                 }
                        }
                } else {
                    const formattedData = {
                        ...data,
                        content: data.content, //use the content if it is not a URL
                    };
                     setCaseStudyPost(formattedData);
                        if (isUserLoggedIn && user && formattedData.likeBy) {
                            setHasLiked(formattedData.likeBy.includes(user._id));
                           }
                           if (isUserLoggedIn && user && formattedData.dislikeBy) {
                              setHasDisliked(formattedData.dislikeBy.includes(user._id));
                         }
                }
            } catch (err: any) {
                console.error('Error fetching case study post:', err);
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug, isUserLoggedIn, user]);

    const handleLike = useCallback(async () => {
        if (!isUserLoggedIn || !user) {
            toast.error("Please log in to like this post", { position: "top-right" });
            return;
        }
        if(!caseStudyPost?._id) return
        try {
           const response = await fetch(`/api/case-study/posts/${caseStudyPost._id}/like`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id }),
          });

             if (!response.ok) {
                const errorData = await response.json();
                 toast.error(errorData.message || "Failed to like the post", { position: "top-right" });
                 throw new Error(errorData.message || 'Failed to update like');
             }

             const updatedPost = await response.json();
             setCaseStudyPost(updatedPost);
             setHasLiked(updatedPost.likeBy?.includes(user._id));
             setHasDisliked(updatedPost.dislikeBy?.includes(user._id));
         } catch (error: any) {
              console.error('Error updating like:', error);
             toast.error(error.message || 'An error occurred while updating like', { position: "top-right" });
         }

    }, [caseStudyPost, user, isUserLoggedIn]);


     const handleDislike = useCallback(async () => {
          if (!isUserLoggedIn || !user) {
               toast.error("Please log in to dislike this post", { position: "top-right" });
                return;
        }
           if(!caseStudyPost?._id) return
          try {
               const response = await fetch(`/api/case-study/posts/${caseStudyPost._id}/dislike`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user._id }),
                });


               if (!response.ok) {
                  const errorData = await response.json();
                    toast.error(errorData.message || 'Failed to dislike the post', { position: "top-right" });
                    throw new Error(errorData.message || 'Failed to update dislike');
                 }
                 const updatedPost = await response.json();
                  setCaseStudyPost(updatedPost);
                  setHasDisliked(updatedPost.dislikeBy?.includes(user._id));
                  setHasLiked(updatedPost.likeBy?.includes(user._id));
                } catch (error: any) {
                     console.error('Error updating dislike:', error);
                      toast.error(error.message || 'An error occurred while updating dislike', { position: "top-right" });
                }
     }, [caseStudyPost, user, isUserLoggedIn]);


    const renderSkeleton = () => (
        <div className="flex min-h-screen">
           <Sidebar
                                 isSidebarOpen={isSidebarOpen}
                                 toggleSidebar={toggleSidebar}
                                 activeSidebarItem={activeSidebarItem}
                                 setActiveSidebarItem={setActiveSidebarItem}
                                 token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
                             />
            <div className="flex-1">
               <Header toggleSidebar={toggleSidebar} activeNavItem={activeNavItem} />
                <div className="container mx-auto p-4">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                            <div className="flex items-center mt-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="ml-3">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24 mt-1" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full mb-4" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-5/6 mb-2" />
                            <Skeleton className="h-4 w-4/6" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return renderSkeleton();
    }

    if (error) {
        return (
            <div className="flex min-h-screen">
               <Sidebar
                                     isSidebarOpen={isSidebarOpen}
                                     toggleSidebar={toggleSidebar}
                                     activeSidebarItem={activeSidebarItem}
                                     setActiveSidebarItem={setActiveSidebarItem}
                                     token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
                                 />
                <div className="flex-1">
                    <Header toggleSidebar={toggleSidebar} activeNavItem={activeNavItem} />
                    <div className="container mx-auto p-4">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error! </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!caseStudyPost) {
        return (
             <div className="flex min-h-screen">
                <Sidebar
                                      isSidebarOpen={isSidebarOpen}
                                      toggleSidebar={toggleSidebar}
                                      activeSidebarItem={activeSidebarItem}
                                      setActiveSidebarItem={setActiveSidebarItem}
                                      token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
                                  />
                <div className="flex-1">
                   <Header toggleSidebar={toggleSidebar} activeNavItem={activeNavItem} />
                    <div className="container mx-auto p-4">
                        <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Not found! </strong>
                            <span className="block sm:inline">Case study not found</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleSave = () => {
        setIsSaved(!isSaved)
    }
    const handleShare = () => {
    
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar
                                  isSidebarOpen={isSidebarOpen}
                                  toggleSidebar={toggleSidebar}
                                  activeSidebarItem={activeSidebarItem}
                                  setActiveSidebarItem={setActiveSidebarItem}
                                  token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
                              />
            <div className="flex-1">
               <Header toggleSidebar={toggleSidebar} activeNavItem={activeNavItem} />
                <div className="container mx-auto p-4">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold">{caseStudyPost.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {caseStudyPost.featuredImage && (
                                <div className="relative aspect-video rounded-lg overflow-hidden">
                                    <Image
                                        src={caseStudyPost.featuredImage}
                                        alt={caseStudyPost.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            )}
                             <div className="flex items-center mb-4">
                                        <Avatar className="w-6 h-6 mr-1">
                                        <AvatarImage src={caseStudyPost.channelLogo || '/placeholder.svg'} alt={`${caseStudyPost.author} logo`} />
                                        <AvatarFallback>{caseStudyPost.author?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                        <span className="font-semibold">
                                                {caseStudyPost.author}</span>
                                                <div className="text-sm text-gray-500">
                                                                        <span>Published on Biz • </span>
                                                                        <span>8 min read • </span>
                                                                        <span>{format(new Date(caseStudyPost.createdAt), 'MMMM dd, yyyy')}</span>
                                                                    </div>
                            </div>
                            <button className="ml-auto bg-[#2A2FB8] text-sm text-white px-4 py-1 rounded-lg hover:bg-purple-700 transition-colors duration-300">Follow</button>
                            </div>
                            <div className="mt-6 flex items-center justify-between ">
                                                <div className="flex items-center space-x-4">
                                                    <button  onClick={handleLike}  className={`flex items-center space-x-1 ${hasLiked ? 'text-blue-500' : 'text-gray-600'}`}>
                                                        <Image src={`/uploads/Like${hasLiked ? "_filled": ''}.png`} alt="like" width={40} height={40}/>
                                                        <span>{caseStudyPost.likes}</span>
                                                    </button>
                                                    <button onClick={handleDislike} className={`flex items-center space-x-1 ${hasDisliked ? 'text-red-500' : 'text-gray-600'}`}>
                                                        <Image src={`/uploads/Dislike${hasDisliked ? "_filled": ''}.png`} alt="dislike" width={40} height={40}/>
                                                        <span>{caseStudyPost.dislikes}</span>
                                                    </button>
                                                    <span className="text-gray-600">{caseStudyPost.views} views</span>
                                                </div>
                                
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={handleSave} className={isSaved ? 'text-blue-500' : 'text-gray-600'}>
                                                        <Image src={`/uploads/Save${isSaved ? "_filled": ''}.png`} alt="save" width={40} height={40}/>
                                                        </button>
                                                    <button onClick={handleShare}>
                                                        <Image src="/uploads/Share.png" alt="share" width={40} height={40} />
                                                    </button>
                                                </div>
                                            </div>
                            <Separator className="my-4" />
                            <div
                                className="prose max-w-none text-sm dark:prose-invert"
                                dangerouslySetInnerHTML={{
                                    __html: caseStudyPost.content || ''
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CaseStudyPostPage;