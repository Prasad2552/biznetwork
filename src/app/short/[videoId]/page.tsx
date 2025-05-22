"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Play, Pause, ChevronUp, ChevronDown } from "lucide-react"
import Sidebar from "@/components/sidebar"
import styles from "./page.module.css"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuthCheck } from "@/hooks/useAuthCheck"
import Image from 'next/image'
import ShareModal from "@/components/ShareModal"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import MoreOptionsModal from "@/components/MoreOptionsModal"
import debounce from 'lodash/debounce'

// Import icons
const LikeIconSrc = "/uploads/Like.png"
const DislikeIconSrc = "/uploads/dislike.png"
const ShareIconSrc = "/uploads/share.png"
const MoreIconSrc = "/uploads/More.png"
const FilledLikeIconSrc = "/uploads/filledlike.svg"
const BackButtonSrc = "/uploads/Back.png" // Import Back Button Source

interface Short {
    _id: string
    title: string
    videoUrl: string
    channelId: string
    channel: {
        name: string
        logo: string
    }
    views: number
    likes: number
    dislikes: number
    likedBy: string[]
    dislikedBy: string[]
}

export default function ShortsPage() {
    const [shorts, setShorts] = useState<Short[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSidebarItem, setActiveSidebarItem] = useState("About Us")
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [currentShortIndex, setCurrentShortIndex] = useState(0)
    const [isMuted, setIsMuted] = useState(true)
    const [isPlaying, setIsPlaying] = useState(true)
    const [progress, setProgress] = useState(0)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isMoreOptionsModalOpen, setIsMoreOptionsModalOpen] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [isHovering, setIsHovering] = useState(false)
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }
    const { isUserLoggedIn } = useAuthCheck();
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const touchStartRef = useRef(0)
    const { data: session } = useSession()
    const userId = session?.user?.id
    const { token } = useAuthCheck()
    const router = useRouter()
    const navigationTimeoutRef = useRef<NodeJS.Timeout>()
    const preloadedVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({})
    const viewCountUpdatedRef = useRef<Set<string>>(new Set()); // Use a Set to track view counts
    const currentShort = shorts[currentShortIndex];
    
const shortId = currentShort?._id;
    // Debounced URL update
    const updateUrl = useCallback(
        debounce((shortId: string) => {
            router.replace(`/short/${shortId}`, { scroll: false })
        }, 300),
        [router]
    )

    // Preload videos
    const preloadVideo = useCallback((url: string) => {
        if (!preloadedVideosRef.current[url]) {
            const video = document.createElement('video')
            video.src = url
            video.preload = 'auto'
            preloadedVideosRef.current[url] = video
        }
    }, [])

    const updateViewCount = useCallback(async (shortId: string) => {
        // Check if already processed or in progress
        if (viewCountUpdatedRef.current.has(shortId)) {
            return;
        }
    
        // Mark as in progress immediately
        viewCountUpdatedRef.current.add(shortId);
    
        try {
            const response = await fetch(`/api/shorts/${shortId}/view`, {
                method: 'PUT',
            });
    
            if (!response.ok) {
                // Remove from set on failure to allow retry
                viewCountUpdatedRef.current.delete(shortId);
                console.error('Failed to update view count');
            } else {
                const data = await response.json();
                // Update state with server's view count
                setShorts(prevShorts =>
                    prevShorts.map(short =>
                        short._id === shortId ? { ...short, views: data.views } : short
                    )
                );
            }
        } catch (error) {
            // Remove from set on error
            viewCountUpdatedRef.current.delete(shortId);
            console.error('Error updating view count:', error);
        }
    }, [token]);


    useEffect(() => {
        if (!shortId) return;
    
        const handleLoad = () => updateViewCount(shortId);
    
        if (document.readyState === 'complete') {
            handleLoad();
        } else {
            window.addEventListener('load', handleLoad);
            return () => window.removeEventListener('load', handleLoad);
        }
    }, [shortId, updateViewCount]); // Depend on shortId and updateViewCount
    

    // Enhanced video loading with transition handling
    const loadVideo = useCallback(async () => {
        if (!shorts.length || !videoRef.current) return;
      
        const currentShort = shorts[currentShortIndex];
        if (!currentShort) return;
      
        setIsTransitioning(true);
      
        const preloadVideoElement = preloadedVideosRef.current[currentShort.videoUrl];
      
        if (preloadVideoElement && preloadVideoElement.readyState >= 2) { // HAVE_CURRENT_DATA
          try {
            videoRef.current.src = currentShort.videoUrl;
            await new Promise<void>((resolve) => {
              if (!videoRef.current) return; // Check again inside the promise
              videoRef.current.onloadeddata = () => resolve();
              videoRef.current.load();
            });
            if (isPlaying) {
              await videoRef.current.play().catch(() => { }); // Optional chaining
            }
            updateUrl(currentShort._id);
          } catch (err) {
            console.error("Video loading error:", err);
            toast.error("Error loading video", { position: 'top-right' });
          }
        } else {
          // Video Not Preloaded Yet - Wait
          const video = document.createElement('video')
          video.src = currentShort.videoUrl
          video.preload = 'auto'
          preloadedVideosRef.current[currentShort.videoUrl] = video
          video.addEventListener('loadeddata', () => {
            try {
              if (!videoRef.current) return;  // Important null check
              videoRef.current.src = currentShort.videoUrl;
              videoRef.current.load();
              if (isPlaying) {
                videoRef.current.play().catch(() => { }); // Optional chaining
              }
              updateUrl(currentShort._id);
            } catch (err) {
              console.error("Video loading error:", err);
              toast.error("Error loading video", { position: 'top-right' });
            }
          }, { once: true }); // Ensure the event listener is removed after the event triggers
        }
      }, [currentShortIndex, shorts, updateUrl, isPlaying]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);


    useEffect(() => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.play().catch(() => { /* Autoplay handled */ });
        } else {
            videoRef.current.pause();
        }
    }, [isPlaying]);

        useEffect(() => {
        const addNoScroll = () => {
            document.body.classList.add('no-shorts-scroll');
        };

        const removeNoScroll = () => {
            document.body.classList.remove('no-shorts-scroll');
        };

        if (!loading) {
            addNoScroll();
        }

        return () => {
            removeNoScroll();
        };
    }, [loading]);

    

    // Debounced scroll handler
    const handleScroll = useCallback(
        debounce((direction: "up" | "down") => {
            if (isTransitioning) return

            setCurrentShortIndex((prevIndex) => {
                const newIndex = direction === "up"
                    ? Math.max(0, prevIndex - 1)
                    : Math.min(shorts.length - 1, prevIndex + 1)
                
                // Clear any existing navigation timeout
                if (navigationTimeoutRef.current) {
                    clearTimeout(navigationTimeoutRef.current)
                }

                // Set a new timeout to prevent rapid navigation
                navigationTimeoutRef.current = setTimeout(() => {
                    setIsTransitioning(false)
                }, 300)

                return newIndex
            })
        }, 300),
        [shorts.length, isTransitioning]
    )

    // Initialize shorts and handle URL routing
    useEffect(() => {
        const fetchShorts = async () => {
            try {
                const response = await fetch("/api/shorts")
                if (!response.ok) throw new Error("Failed to fetch shorts")
                const data = await response.json()
                setShorts(data.shorts)
                
                const pathParts = window.location.pathname.split('/')
                const urlShortId = pathParts[pathParts.length - 1]
                if (urlShortId && urlShortId !== 'shorts') {
                    const index = data.shorts.findIndex((s: Short) => s._id === urlShortId)
                    if (index !== -1) setCurrentShortIndex(index)
                }
            } catch (error) {
                console.error("Error fetching shorts:", error)
                setError("Failed to load shorts. Please try again later.")
            } finally {
                setLoading(false)
            }
        }
        fetchShorts()
    }, [])

    // Handle video loading and preloading
    useEffect(() => {
        loadVideo();

        // Preload adjacent videos
        const nextIndex = (currentShortIndex + 1) % shorts.length;
        const prevIndex = (currentShortIndex - 1 + shorts.length) % shorts.length;
        if (shorts[nextIndex]) preloadVideo(shorts[nextIndex].videoUrl);
        if (shorts[prevIndex]) preloadVideo(shorts[prevIndex].videoUrl);

        return () => {
            if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
        };
    }, [currentShortIndex, shorts, loadVideo, preloadVideo]);

    // Update view count when currentShortIndex changes
    useEffect(() => {
        if (shorts.length > 0 && currentShortIndex >= 0 && currentShortIndex < shorts.length) {
            const shortId = shorts[currentShortIndex]._id;
            updateViewCount(shortId);
        }
    }, [currentShortIndex, shorts, updateViewCount]);

    // Progress update interval
    useEffect(() => {
        const intervalId = setInterval(updateProgress, 500)
        return () => clearInterval(intervalId)
    }, [])

    // Wheel event handler
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            if (!isTransitioning) {
                if (e.deltaY > 5) {
                    handleScroll("down")
                } else if (e.deltaY < -5) {
                    handleScroll("up")
                }
            }
        }

        container.addEventListener("wheel", handleWheel, { passive: false })
        return () => container.removeEventListener("wheel", handleWheel)
    }, [handleScroll, isTransitioning])

    // Touch handlers
    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        touchStartRef.current = event.touches[0].clientY
    }

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (isTransitioning) return

        const touchEnd = event.changedTouches[0].clientY
        const deltaY = touchEnd - touchStartRef.current

        if (Math.abs(deltaY) > 50) {
            handleScroll(deltaY > 0 ? "up" : "down")
        }
    }

    // Video controls
    const updateProgress = () => {
        if (videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
            setProgress(isNaN(progress) ? 0 : progress)
        }
    }

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = (parseFloat(event.target.value) / 100) * videoRef.current.duration
            videoRef.current.currentTime = time
            updateProgress()
        }
    }

    // Interaction handlers
    const handleLike = async () => {
        if (!userId) {
            toast.error("Please sign in to like shorts", { position: 'top-right' })
            return
        }

        try {
            const response = await fetch(`/api/shorts/${shorts[currentShortIndex]._id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Failed to like short')

            const data = await response.json()
            setShorts(prevShorts => prevShorts.map(short => 
                short._id === shorts[currentShortIndex]._id ? { ...short, ...data } : short
            ))
        } catch (error) {
            console.error("Like error:", error)
            toast.error("Failed to like short", { position: 'top-right' })
        }
    }

    const handleDislike = async () => {
        if (!userId) {
            toast.error("Please sign in to dislike shorts", { position: 'top-right' })
            return
        }

        try {
            const response = await fetch(`/api/shorts/${shorts[currentShortIndex]._id}/dislike`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Failed to dislike short')

            const data = await response.json()
            setShorts(prevShorts => prevShorts.map(short => 
                short._id === shorts[currentShortIndex]._id ? { ...short, ...data } : short
            ))
        } catch (error) {
            console.error("Dislike error:", error)
            toast.error("Failed to dislike short", { position: 'top-right' })
        }
    }

    // Fetch more shorts when needed
    const fetchMoreShorts = async () => {
        if (!hasMore) return

        try {
            const response = await fetch(`/api/shorts?skip=${shorts.length}`)
            if (!response.ok) throw new Error("Failed to fetch more shorts")
            
            const data = await response.json()
            if (data.shorts.length === 0) {
                setHasMore(false)
            } else {
                setShorts(prevShorts => [...prevShorts, ...data.shorts])
            }
        } catch (error) {
            console.error("Error fetching more shorts:", error)
        }
    }

    useEffect(() => {
        if (currentShortIndex === shorts.length - 1) {
            fetchMoreShorts()
        }
    }, [currentShortIndex, shorts.length])

    if (error) {
        return (
            <div className="flex flex-col h-screen items-center justify-center">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        )
    }

    const isLiked = userId ? currentShort?.likedBy?.includes(userId) : false
    const isDisliked = userId ? currentShort?.dislikedBy?.includes(userId) : false
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/short/${currentShort?._id}` : ''
    const truncatedChannelName = currentShort?.channel?.name
        ? currentShort.channel.name.split(" ").slice(0, 2).join(" ")
        : "Channel"

    return (
        <div className="flex min-h-screen bg-[#F9F9F9]  ">
            <Sidebar
                                                                    isSidebarOpen={isSidebarOpen}
                                                                    toggleSidebar={toggleSidebar}
                                                                    activeSidebarItem={activeSidebarItem}
                                                                    setActiveSidebarItem={setActiveSidebarItem}
                                                                    token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
                                                                />
            <div className="flex-1 ">
               

                {loading ? (
                    <div className="flex flex-col h-screen items-center justify-center">
                        <Skeleton className="h-64 w-48 rounded-xl" />
                        <p className="mt-4 text-gray-500">Loading shorts...</p>
                    </div>
                ) : (
                    <>
                         <Link href="/reels" className={styles["back-button-container"]}>
                            <Image
                                src={BackButtonSrc} // Use the imported variable
                                alt="Back to Reels"
                                width={40}
                                height={40}
                                priority
                            />
                        </Link>

                        <div
                            ref={containerRef}
                            className={styles["shorts-container"]}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >

                            <div
                                className={styles["mute-button-container"]} // Style this as needed
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white bg-black/50 rounded-full transition-opacity"
                                    onClick={toggleMute}
                                    disabled={isTransitioning}
                                    aria-label="Toggle Mute"
                                >
                                    {isMuted ? (
                                        <VolumeX className="h-6 w-6" />
                                    ) : (
                                        <Volume2 className="h-6 w-6" />
                                    )}
                                </Button>
                            </div>

                            <video
            ref={videoRef}
            className={`${styles["shorts-video"]} ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            onLoadedData={() => setIsTransitioning(false)}
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
        />

                            <div
                                className={styles["play-pause-container"]}
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                            >
                                {(!isPlaying || isHovering) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={styles["play-pause-button"]}
                                        onClick={togglePlay}
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-12 w-12 text-white/90" />
                                        ) : (
                                            <Play className="h-12 w-12 text-white/90" />
                                        )}
                                    </Button>
                                )}
                            </div>

                            <div className={styles["info-container"]}>
                                <div className="flex items-start gap-3">
                                    <Link href={`/@${currentShort?.channel?.name.replace(/\s+/g, '%20')}`} className="contents">
                                        <Avatar className="h-10 w-10 border-2 border-white">
                                            <AvatarImage src={currentShort?.channel?.logo || "/placeholder.svg"} />
                                            <AvatarFallback>{currentShort?.channel?.name?.charAt(0) || 'CN'}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1">
                                        <h2 className="text-white text-xs truncate line-clamp-2">
                                            {currentShort?.title || "Loading..."}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-white/90 text-xs truncate">
                                                {truncatedChannelName}
                                            </p>
                                        </div>
                                        <p className="text-white/70 text-xs">
                                            {currentShort?.views?.toLocaleString() || "0"} views
                                        </p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        className="bg-[#2A2FB8] text-xs text-white rounded-full hover:bg-[#2A2FB9]"
                                    >
                                        Follow
                                    </Button>
                                </div>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                className={styles["timeline"]}
                                onChange={handleSeek}
                                style={{
                                    "--played-progress": `${progress}%`,
                                    "--played-progress-remaining": `${100 - progress}%`,
                                } as React.CSSProperties}
                            />
                        </div>

                        {/* Conditional rendering for external controls */}
                        {currentShort && (
                            <>
                            <div className={styles["external-controls-container"]}>
                                <div className="flex flex-col items-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={styles["external-control-button"]}
                                        onClick={handleLike}
                                        disabled={isTransitioning}
                                    >
                                        {isLiked ? (
                                            <Image
                                                src={FilledLikeIconSrc}
                                                alt="Liked"
                                                width={34}
                                                height={34}
                                                priority
                                            />
                                        ) : (
                                            <Image
                                                src={LikeIconSrc}
                                                alt="Like"
                                                width={34}
                                                height={34}
                                                priority
                                                className={isLiked ? 'filter-blue' : ''}
                                            />
                                        )}
                                    </Button>
                                    <span className="text-[#2A2FB8] text-xs">{currentShort?.likes}</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={styles["external-control-button"]}
                                        onClick={handleDislike}
                                        disabled={isTransitioning}
                                    >
                                        <Image
                                            src={DislikeIconSrc}
                                            alt="Dislike"
                                            width={34}
                                            height={34}
                                            priority
                                            className={isDisliked ? 'filter-blue' : ''}
                                        />
                                    </Button>
                                    <span className="text-[#2A2FB8] text-xs">{currentShort?.dislikes}</span>
                                </div>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={styles["external-control-button"]}
                                            onClick={() => setIsShareModalOpen(true)}
                                            disabled={isTransitioning}
                                        >
                                            <Image
                                                src={ShareIconSrc}
                                                alt="Share"
                                                width={34}
                                                height={34}
                                                priority
                                            />
                                        </Button>
                                    </DialogTrigger>
                                    <ShareModal
                                        isOpen={isShareModalOpen}
                                        onClose={() => setIsShareModalOpen(false)}
                                        shareUrl={shareUrl}
                                        title={currentShort?.title || "Check out this short!"}
                                    />
                                </Dialog>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={styles["external-control-button"]}
                                            onClick={() => setIsMoreOptionsModalOpen(true)}
                                            disabled={isTransitioning}
                                        >
                                            <Image
                                                src={MoreIconSrc}
                                                alt="More"
                                                width={34}
                                                height={34}
                                                priority
                                            />
                                        </Button>
                                    </DialogTrigger>
                                    <MoreOptionsModal
                                        isOpen={isMoreOptionsModalOpen}
                                        onClose={() => setIsMoreOptionsModalOpen(false)}
                                        onReport={() => {
                                            setIsMoreOptionsModalOpen(false)
                                            toast.info("Video reported for review.", { position: 'top-right' })
                                        }}
                                        onAddToPlaylist={() => {
                                            setIsMoreOptionsModalOpen(false)
                                            toast.success("Added to your playlist!", { position: 'top-right' })
                                        }}
                                    />
                                </Dialog>

                            </div>
                            <div className={styles["navigation-arrows-external"]}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white flex mb-2 bg-black/50 rounded-full transition-opacity"
                                        onClick={() => handleScroll("up")}
                                        disabled={currentShortIndex === 0 || isTransitioning}
                                        aria-label="Previous short"
                                    >
                                        <ChevronUp className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white flex bg-black/50 rounded-full transition-opacity"
                                        onClick={() => handleScroll("down")}
                                        disabled={currentShortIndex === shorts.length - 1 || isTransitioning}
                                        aria-label="Next short"
                                    >
                                        <ChevronDown className="h-6 w-6" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}


            </div>
        </div>
    )
}