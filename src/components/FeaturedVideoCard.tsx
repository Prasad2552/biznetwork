// src\components\FeaturedVideoCard.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import VideoPlayer from "./video-player";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Share, Plus, MoreHorizontal, ThumbsUp, ThumbsDown } from "lucide-react";
import { ShareDialog } from "./share-dialog";
import { useSession } from "next-auth/react";
import { useChannelFollow } from "@/hooks/useChannelFollow";
import type { Video } from "@/types/common";
import "react-toastify/dist/ReactToastify.css";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import Image from "next/image";
import { useAuthContext } from "@/contexts/auth-context";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";


interface FeaturedVideoCardProps {
    featuredVideo: Video | null
    updateVideoState: (videoId: string, data: any) => void
    handleLike: (videoId: string) => Promise<void>
    handleDislike: (videoId: string) => Promise<void>
    handleEmptyVideoView: () => Promise<void>
    handleFeaturedVideoSubscriberCountChange: (count: number) => void
    isCommentInputVisible: boolean
    setIsCommentInputVisible: React.Dispatch<React.SetStateAction<boolean>>
    newComment: string
    setNewComment: React.Dispatch<React.SetStateAction<string>>
    handleCommentSubmit: (videoId: string) => void
    isVideoLiked: (video?: Video | null) => boolean
    isVideoDisliked: (video?: Video | null) => boolean
    subscriberCount: number
    comments: any[]
    setComments: React.Dispatch<React.SetStateAction<any[]>>
    commentCount: number
}

export const FeaturedVideoCard: React.FC<FeaturedVideoCardProps> =
    ({
        featuredVideo,
        handleEmptyVideoView,
        handleFeaturedVideoSubscriberCountChange,
        subscriberCount,
        updateVideoState,
    }) => {
        const { data: session } = useSession()
        const { isFollowing, toggleFollow, isLoading, followerCount } = useChannelFollow(featuredVideo?.channel || "")
        const [localFollowerCount, setLocalFollowerCount] = useState(subscriberCount)
        const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
        const { isAdmin } = useAuthCheck()
        const { openSignInModal, closeSignInModal, isSignInModalOpen } = useAuthContext()
        const [localVideo, setLocalVideo] = useState<Video | null>(featuredVideo);
        const likeButtonRef = useRef<HTMLButtonElement>(null);
        const dislikeButtonRef = useRef<HTMLButtonElement>(null);
        const [likeAnimationPlaying, setLikeAnimationPlaying] = useState(false);
        const [dislikeAnimationPlaying, setDislikeAnimationPlaying] = useState(false);


        useEffect(() => {
            setLocalVideo(featuredVideo);
        }, [featuredVideo]);


        const handleFollowClick = useCallback(async () => {
            if (!session?.user) {
                openSignInModal()
                return
            }
            await toggleFollow()
        }, [session?.user, toggleFollow, openSignInModal])

        useEffect(() => {
            if (followerCount) {
                setLocalFollowerCount(followerCount)
                handleFeaturedVideoSubscriberCountChange(followerCount)
            }
        }, [followerCount, handleFeaturedVideoSubscriberCountChange])

        if (!featuredVideo || !localVideo) {
            return <div>Loading Featured Video...</div>
        }

        const handleLikeClick = async () => {
            if (session?.user && localVideo) {
                try {
                    // Trigger animation before API call
                    if (likeButtonRef.current && !isAdmin && session?.user) {
                        setLikeAnimationPlaying(true);
                        likeButtonRef.current.classList.add("animate-like"); // Apply animation class
                        setTimeout(() => {
                            likeButtonRef.current?.classList.remove("animate-like"); // Remove animation class
                            setLikeAnimationPlaying(false);
                        }, 800); // Adjust duration to match your animation
                    }

                    const response = await fetch(`/api/videos/${localVideo._id}/like`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });


                    if (!response.ok) {
                        throw new Error('Failed to like video');
                    }
                    const data = await response.json();
                    updateVideoState(localVideo._id, data);
                    setLocalVideo(prev => {
                        if (prev) {
                            return {
                                ...prev,
                                likes: data.likes,
                                dislikes: data.dislikes,
                                likedBy: data.likedBy,
                                dislikedBy: data.dislikedBy
                            };
                        }
                        return prev;
                    });

                } catch (error) {
                    console.error('Error liking video:', error);
                }
            } else {
                openSignInModal()
            }
        };


        const handleDislikeClick = async () => {
            if (session?.user && localVideo) {
                try {
                    if (dislikeButtonRef.current && !isAdmin && session?.user) {
                        setDislikeAnimationPlaying(true);
                        dislikeButtonRef.current.classList.add("animate-dislike"); // Apply animation class
                        setTimeout(() => {
                            dislikeButtonRef.current?.classList.remove("animate-dislike"); // Remove animation class
                            setDislikeAnimationPlaying(false);
                        }, 800);
                    }

                    const response = await fetch(`/api/videos/${localVideo._id}/dislike`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    if (!response.ok) {
                        throw new Error('Failed to dislike video');
                    }
                    const data = await response.json();
                    updateVideoState(localVideo._id, data);
                    setLocalVideo(prev => {
                        if (prev) {
                            return {
                                ...prev,
                                likes: data.likes,
                                dislikes: data.dislikes,
                                likedBy: data.likedBy,
                                dislikedBy: data.dislikedBy
                            };
                        }
                        return prev;
                    });

                } catch (error) {
                    console.error('Error disliking video:', error);
                }
            } else {
                openSignInModal()
            }
        };

        const isVideoLikedByUser = (video?: Video | null): boolean => {
            if (!video || !session?.user) return false;
            return video.likedBy?.some((userId) => userId === session?.user?.id || userId === session?.user?.email) || false;
        };

        const isVideoDislikedByUser = (video?: Video | null): boolean => {
            if (!video || !session?.user) return false;
            return video.dislikedBy?.some((userId) => userId === session?.user?.id || userId === session?.user?.email) || false;
        };


        const renderVideo = (
            <div className="relative">
                {localVideo && (
                    <VideoPlayer
                        key={localVideo._id}
                        src={localVideo.videoUrl}
                        poster={localVideo.thumbnailUrl}
                        className="w-full h-auto"
                        autoPlay
                        muted
                        loop
                        onLike={
                            isAdmin
                                ? async () => {
                                }
                                : handleLikeClick
                        }
                        onDislike={
                            isAdmin
                                ? async () => {
                                }
                                : handleDislikeClick
                        }
                        onVideoView={handleEmptyVideoView}
                    />
                )}
            </div>
        )

        const renderThumbnail = (
            <div className="relative w-full h-auto ">
                {localVideo?.thumbnailUrl && (
                    <Image
                        src={localVideo?.thumbnailUrl || "/placeholder.svg"}
                        alt={localVideo?.title || "Featured thumbnail"}
                        fill
                        priority
                        className="object-cover absolute top-0 left-0 w-full h-full"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                )}
            </div>
        )

        return (
            <Card className="mb-8 overflow-hidden font-normal">
                <CardContent className="p-0">
                    {renderVideo}
                    {renderThumbnail}
                    <div className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div className="flex items-center space-x-3 mb-4 md:mb-0">
                                <Avatar className="w-8 h-8">
                                    {localVideo?.channelLogo && (
                                        <AvatarImage src={`${localVideo.channelLogo}`} alt="Channel logo" />
                                    )}
                                    <AvatarFallback>{localVideo?.channel?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-sm">{localVideo?.channel}</h3>
                                    <p className="text-xs text-gray-600 ">{localFollowerCount} followers</p>
                                </div>
                                <Button
                                    variant="default"
                                    onClick={handleFollowClick}
                                    className="bg-[#2A2FB8] hover:bg-[#0C1197] text-white text-xs font-medium px-4 py-2 rounded-full h-8"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Loading..." : session?.user ? (isFollowing ? "Unfollow" : "Follow") : "Follow"}
                                </Button>
                            </div>
                            <div className="flex items-center gap-4 md:gap-2">
                                <div className="inline-flex rounded-full border bg-gray-100 border-gray-200">
                                    {!isAdmin && session?.user && localVideo ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                ref={likeButtonRef}
                                                className={`flex items-center space-x-1 transition-all duration-200 ease-in-out
                        hover:scale-105 active:scale-95 border-none bg-gray-100 rounded-full px-3 py-2
                        ${isVideoLikedByUser(localVideo) ? "text-blue-600" : ""}
                         ${likeAnimationPlaying ? "pointer-events-none" : ""}
                          `}
                                                onClick={handleLikeClick}
                                                disabled={likeAnimationPlaying}
                                            >
                                                <ThumbsUp
                                                    className={`w-4 h-4 transition-all duration-200 ease-in-out
                           ${isVideoLikedByUser(localVideo) ? "fill-blue-600 stroke-blue-600" : ""}`}

                                                />
                                                <span>{localVideo?.likes ?? 0}</span>
                                            </Button>
                                            <span className="border-[1px] border-gray-200 mx-1 my-1"></span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                ref={dislikeButtonRef}
                                                className={`flex items-center space-x-1 transition-all duration-200 ease-in-out
                        hover:scale-105 active:scale-95 border-none bg-gray-100 rounded-full px-3 py-2
                        ${isVideoDislikedByUser(localVideo) ? "text-blue-600" : ""}
                         ${dislikeAnimationPlaying ? "pointer-events-none" : ""}
                          `}
                                                onClick={handleDislikeClick}
                                                disabled={dislikeAnimationPlaying}
                                            >
                                                <ThumbsDown
                                                    className={`w-4 h-4 transition-all duration-200 ease-in-out
                           ${isVideoDislikedByUser(localVideo) ? "fill-blue-600 stroke-blue-600" : ""}`}
                                                />
                                                <span>{localVideo?.dislikes ?? 0}</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center space-x-1 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 border-none bg-gray-100 rounded-full px-3 py-2"
                                                onClick={() => openSignInModal()}
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                                <span>{localVideo?.likes ?? 0}</span>
                                            </Button>
                                            <span className="border-[1px] border-gray-200 mx-1 my-1"></span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center space-x-1 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 border-none bg-gray-100 rounded-full px-3 py-2"
                                                onClick={() => openSignInModal()}
                                            >
                                                <ThumbsDown className="w-4 h-4" />
                                                <span>{localVideo?.dislikes ?? 0}</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center space-x-1 px-2 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
                                    onClick={() => setIsShareDialogOpen(true)}
                                >
                                    <Share className="w-4 h-4" />
                                    <span>Share</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center space-x-1 px-2 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Save</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            {localVideo?.views || 0} views •{" "}
                            {formatDistanceToNow(new Date(localVideo?.uploadDate || Date.now()))} ago
                        </p>
                        <p className="mb-2">{localVideo?.title}</p>
                        <p className="text-sm text-blue-600 mb-4">
                            <Link href="#">{localVideo?.channel}</Link>
                        </p>
                        <Dialog open={isSignInModalOpen} onOpenChange={closeSignInModal}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Sign in</DialogTitle>
                                    <DialogDescription>Sign in to like or dislike the video</DialogDescription>
                                </DialogHeader>
                                <Link href="/signin">
                                    <Button type="button" className="w-full bg-[#0041C2] hover:bg-[#0033A3] text-white font-medium h-11">
                                        Sign In
                                    </Button>
                                </Link>
                            </DialogContent>
                        </Dialog>
                        <ShareDialog
                            isOpen={isShareDialogOpen}
                            onClose={() => setIsShareDialogOpen(false)}
                            videoId={localVideo.slug ?? localVideo._id}
                            videoTitle={localVideo.title}
                            videoType={localVideo.type || "videos"}
                        />
                    </div>
                </CardContent>
            </Card>
        )
    }

export default FeaturedVideoCard
