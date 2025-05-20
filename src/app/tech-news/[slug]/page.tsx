// src/app/tech-news/[slug]/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react' // Import useCallback and useRef
import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"
import { format } from 'date-fns'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { useRouter } from 'next/navigation'
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ShareModal from "@/components/ShareModal"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { use } from 'react';

interface TechNewsArticle {
    _id: string
    title: string
    content: string
    createdAt: string
    featuredImage?: string
    channelId?: string
    slug: string
    likes?: number
    dislikes?: number
}

interface SidebarTechNewsArticle {
    _id: string
    title: string
    featuredImage?: string
    slug: string
    createdAt: string
}

interface Channel {
    _id: string;
    name: string;
    logoUrl: string;
}

export default function TechNewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [techNews, setTechNews] = useState<TechNewsArticle | null>(null)
    const [relatedTechNews, setRelatedTechNews] = useState<SidebarTechNewsArticle[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [activeSidebarItem, setActiveSidebarItem] = useState('')
    const [activeNavItem, setActiveNavItem] = useState('All')
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { data: session } = useSession();
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const userId = session?.user?.id || null;

    const [hasLiked, setHasLiked] = useState(false);
    const [hasDisliked, setHasDisliked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showFullContent, setShowFullContent] = useState(false);


    const router = useRouter()

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    const sidebarItems = [
        { name: 'Publish With Us', href: '/publish' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'Help', href: '/help' },
        { name: 'Send Feedback', href: '/sendfeedback' },
    ];

    const actionInProgress = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/tech-news/${slug}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch tech news article')
                }
                const data = await response.json() as TechNewsArticle;
                setTechNews(data);

                const relatedResponse = await fetch('/api/tech-news')
                if (relatedResponse.ok) {
                    const relatedData = await relatedResponse.json()
                    setRelatedTechNews(relatedData.filter((p: TechNewsArticle) => p.slug !== slug).slice(0, 5).map((item: TechNewsArticle) => {
                        return {
                            _id: item._id,
                            title: item.title,
                            featuredImage: item.featuredImage,
                            slug: item.slug,
                            createdAt: item.createdAt
                        }
                    }))
                }

            } catch (error) {
                setError('Error loading tech news article')
                console.error(error)
            }
        }

        const fetchUserInteractions = async () => {
            if (!userId || !techNews?._id) return;
            try {
                const response = await fetch(`/api/users/interactions?techNewsId=${techNews._id}&userId=${userId}`)
                if (response.ok) {
                    const data = await response.json();
                    setHasLiked(data.hasLiked || false);
                    setHasDisliked(data.hasDisliked || false);
                    setIsSaved(data.isSaved || false);
                }
            } catch (error) {
                console.error("Error fetching user interaction:", error)
            }
        };

        fetchData();
        if (userId && techNews?._id) {
            fetchUserInteractions();
        }
    }, [params, userId, techNews?._id])

    useEffect(() => {
        setIsLoggedIn(!!session);
    }, [session])

    const performAction = useCallback(async (action: () => Promise<void>, successMessage: string, errorMessage: string) => {
        if (actionInProgress.current) {
            toast.warn("Please wait, action in progress...", { position: "top-right" });
            return;
        }

        actionInProgress.current = true;
        try {
            await action();
            toast.success(successMessage, { position: "top-right" });
        } catch (error) {
            console.error("Action failed:", error);
            toast.error(errorMessage, { position: "top-right" });
        } finally {
            actionInProgress.current = false;
        }
    }, []);

    const handleLike = useCallback(async () => {
        if (!userId || !techNews?._id) {
            toast.warn("Please log in to like this tech news.", { position: "top-right" });
            return;
        }

        await performAction(async () => {
            const response = await fetch('/api/users/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ techNewsId: techNews._id, userId: userId }),
            });
            if (!response.ok) {
                throw new Error('Failed to like the tech news');
            }
            const data = await response.json();
            setHasLiked(!hasLiked);
            setHasDisliked(false);
                setTechNews((prev) => {
                if (!prev) return prev;
                 return {
                     ...prev,
                       likes: data.likes,
                      dislikes: data.dislikes
                 };
                });
        }, hasLiked ? "Like removed!" : "Tech news liked!", "Failed to update like. Please try again.");
    }, [userId, techNews?._id, hasLiked, performAction]);

    const handleDislike = useCallback(async () => {
        if (!userId || !techNews?._id) {
            toast.warn("Please log in to dislike this tech news.", { position: "top-right" });
            return;
        }

        await performAction(async () => {
            const response = await fetch('/api/users/dislike', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ techNewsId: techNews._id, userId: userId }),
            });
            if (!response.ok) {
                throw new Error('Failed to dislike the tech news');
            }

            setHasDisliked(!hasDisliked);
            setHasLiked(false);
            const data = await response.json();
             setTechNews((prev) => {
              if (!prev) return prev;
                 return {
                     ...prev,
                      likes: data.likes,
                      dislikes: data.dislikes
                 };
                });
        
    }, hasDisliked ? "Dislike removed!" : "Tech news disliked!", "Failed to update dislike. Please try again.");
  }, [userId, techNews?._id, hasDisliked, performAction]);

    const handleSave = useCallback(async () => {
        if (!userId || !techNews?._id) {
            toast.warn("Please log in to save this tech news.", { position: "top-right" });
            return;
        }

        await performAction(async () => {
            const response = await fetch('/api/users/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ techNewsId: techNews._id, userId: userId }),
            });
            if (!response.ok) {
                throw new Error('Failed to save the tech news');
            }

            setIsSaved(!isSaved);
        }, isSaved ? "Tech news unsaved!" : "Tech news saved!", "Failed to save the tech news. Please try again.");
    }, [userId, techNews?._id, isSaved, performAction]);

    
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/tech-news/${techNews?.slug}` : ''
        

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
                <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    activeSidebarItem={activeSidebarItem}
                    setActiveSidebarItem={setActiveSidebarItem}
                    sidebarItems={sidebarItems}
                />
                <div className="flex-1 flex flex-col min-h-screen w-full">
                    <Header
                        toggleSidebar={toggleSidebar}
                        activeNavItem={activeNavItem}
                        isLoggedIn={isLoggedIn} // add this line
                    />
                    <div className="max-w-4xl mx-auto p-6">
                        <div className="text-red-500 p-4 rounded-lg bg-red-50 border border-red-200">
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!techNews) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
                <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    activeSidebarItem={activeSidebarItem}
                    setActiveSidebarItem={setActiveSidebarItem}
                    sidebarItems={sidebarItems}
                />
                <div className="flex-1 flex flex-col min-h-screen w-full">
                    <Header
                        toggleSidebar={toggleSidebar}
                        activeNavItem={activeNavItem}
                        isLoggedIn={isLoggedIn} // add this line
                    />
                    <div className="max-w-4xl mx-auto p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-[400px] bg-gray-200 rounded"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const truncatedContent = showFullContent ? techNews.content : techNews.content.slice(0, 3000);
    const shouldShowReadMore = !showFullContent && techNews.content.length > 500;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                activeSidebarItem={activeSidebarItem}
                setActiveSidebarItem={setActiveSidebarItem}
                sidebarItems={sidebarItems}
            />
            <div className="flex-1 flex flex-col min-h-screen w-full">
                <Header
                    toggleSidebar={toggleSidebar}
                    activeNavItem={activeNavItem}
                    isLoggedIn={isLoggedIn} // add this line
                />
                <div className="flex flex-1">
                    <main className="flex-1 p-6">
                        <Card>
                            <CardContent className="p-6">
                                <h1 className="text-3xl font-bold mb-4">{techNews.title}</h1>
                                {techNews.featuredImage && (
                                    <div className="relative w-full h-[400px] mb-6">
                                        <Image
                                            src={techNews.featuredImage}
                                            alt={techNews.title}
                                            fill
                                            className="object-cover rounded-lg"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                )}

                                <div className="mt-6 flex items-center justify-between ">
                                    <div className="flex items-center space-x-4">
                                        <button onClick={handleLike} className={`flex items-center space-x-1 ${hasLiked ? 'text-blue-500' : 'text-gray-600'}`}>
                                            <Image
                                                src={hasLiked ? `/uploads/filledlike.svg` : `/uploads/Like.svg`}
                                                alt="like"
                                                width={40}
                                                height={40}
                                            />
                                            <span>{techNews.likes}</span>
                                        </button>
                                        <button onClick={handleDislike} className={`flex items-center space-x-1 ${hasDisliked ? 'text-red-500' : 'text-gray-600'}`}>
                                            <Image
                                                src={`/uploads/Dislike.png`}
                                                alt="dislike"
                                                width={40}
                                                height={40}
                                                style={{ filter: hasDisliked ? 'invert(16%) sepia(91%) saturate(7477%) hue-rotate(359deg) brightness(98%) contrast(117%)' : 'none' }}
                                            />
                                            <span>{techNews.dislikes}</span>
                                        </button>

                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button onClick={handleSave} className={isSaved ? 'text-blue-500' : 'text-gray-600'}>
                                            <Image
                                                src={isSaved ? `/uploads/filledsaved.svg` : `/uploads/Save.png`}
                                                alt="save"
                                                width={40}
                                                height={40}
                                            />
                                        </button>
                                        <Dialog>
                                        <DialogTrigger asChild>
                                        <button onClick={() => setIsShareModalOpen(true)}>
                                            <Image
                                                src="/uploads/Share.png"
                                                alt="share"
                                                width={40}
                                                height={40}
                                            />
                                        </button>
                                        </DialogTrigger>
                                        <ShareModal
                                        isOpen={isShareModalOpen}
                                        onClose={() => setIsShareModalOpen(false)}
                                        shareUrl={shareUrl}
                                        title={techNews?.slug || "Check out this news!"}
                                    />
                                        </Dialog>

                                    </div>
                                </div>

                                <div
                                    className="prose max-w-none mt-6"
                                    dangerouslySetInnerHTML={{ __html: truncatedContent + (shouldShowReadMore ? '...' : '') }}
                                >
                                </div>

                                {shouldShowReadMore && (
                                    <button
                                        onClick={() => setShowFullContent(true)}
                                        className="text-blue-600 font-medium flex items-center gap-1"
                                    >
                                        Read More
                                        <ArrowRight className='text-blue-600' size={18} />
                                    </button>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                    <aside className="hidden lg:block w-64 p-6 flex-shrink-0">
                        <h2 className="text-xl font-semibold mb-4">Tech News</h2>
    <div className="space-y-4">
        {relatedTechNews.map((newsItem) => (
            <Link key={newsItem._id} href={`/tech-news/${newsItem.slug}`}>
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
</aside>
                </div>
            </div>
        </div>
    )
}