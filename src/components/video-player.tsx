import React, {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useCallback,
} from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Settings,
    Maximize,
    Minimize,
    RotateCcw,
    RotateCw,
    PictureInPicture,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    className?: string;
    onVideoView?: () => Promise<void>;
    onLike?: () => Promise<void>;
    onDislike?: () => Promise<void>;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    width?: string;
    height?: string;
    aspectRatio?: number; // Aspect ratio for container
}

export type VideoPlayerRef = {
    toggle: () => void;
    play: () => void;
    pause: () => void;
};

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
    (
        {
            src,
            poster,
            className,
            onVideoView,
            autoPlay = false,
            muted = true,
            loop = false,
            width,
            height,
            aspectRatio = 16 / 9, // Default aspect ratio
        },
        ref
    ) => {
        const videoRef = useRef<HTMLVideoElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const progressRef = useRef<HTMLDivElement>(null);
        const settingsButtonRef = useRef<HTMLButtonElement>(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [hasPlayed, setHasPlayed] = useState(false);
         const [isVideoInView, setIsVideoInView] = useState(false);
        const [progress, setProgress] = useState(0);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(0);
        const [volume, setVolume] = useState(1);
        const [isMuted, setIsMuted] = useState(muted);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [showControls, setShowControls] = useState(true);
        const [theaterMode, setTheaterMode] = useState(false);
        const [playbackSpeed, setPlaybackSpeed] = useState(1);
        const [quality, setQuality] = useState("auto");
         const controlsTimeoutRef = useRef<NodeJS.Timeout>();
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [isSettingsOpen, setIsSettingsOpen] = useState(false);
        const [isBuffering, setIsBuffering] = useState(false);

        const togglePictureInPicture = useCallback(async () => {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else if (videoRef.current) {
                    await videoRef.current.requestPictureInPicture();
                }
            } catch (error) {
                console.error("Failed to toggle picture-in-picture mode:", error);
            }
        },[]);


        // Video control methods
        const togglePlay = useCallback(() => {
            const video = videoRef.current;
            if (!video) return;

            if (isPlaying) {
                video.pause();
                setIsLoading(false);
            } else {
                setError(null);
                video.play()
                    .then(() => setIsLoading(false))
                    .catch((error) => {
                        console.error("Playback error:", error);
                        setError("Error starting playback");
                        setIsPlaying(false);
                        setIsLoading(false);
                         setIsBuffering(false);
                    });
            }
        }, [isPlaying]);

        const play = useCallback(() => {
            videoRef.current?.play();
        }, []);

        const pause = useCallback(() => {
            videoRef.current?.pause();
        }, []);

        useImperativeHandle(ref, () => ({
            toggle: togglePlay,
            play,
            pause,
        }));

         useEffect(() => {
           const observer = new IntersectionObserver(
              (entries) => {
                 entries.forEach((entry) => {
                   if (entry.isIntersecting) {
                      setIsVideoInView(true); // Set this to load the video
                      observer.unobserve(entry.target);
                  }
                });
              },
               { threshold: 0.2 }
           );
          if (containerRef.current) {
             observer.observe(containerRef.current);
         }

          return () => {
           if(containerRef.current){
              observer.unobserve(containerRef.current)
            }
          };
         }, []);

        // Event handlers
        useEffect(() => {
            const video = videoRef.current;
            if (!video || !isVideoInView) return;

            const handleTimeUpdate = () => {
                setProgress((video.currentTime / video.duration) * 100);
                setCurrentTime(video.currentTime);
            };

            const handleLoadedMetadata = () => {
                setDuration(video.duration);
                setIsLoading(false);
            };

            const handlePlay = () => {
                setIsPlaying(true);
                setHasPlayed(true);
                setIsLoading(false);
                setIsBuffering(false);
            };

            const handlePause = () => setIsPlaying(false);
             const handleError = () => setError("Error loading video");
            const handleWaiting = () => setIsBuffering(true);
             const handlePlaying = () => setIsBuffering(false);

             video.addEventListener("timeupdate", handleTimeUpdate);
            video.addEventListener("loadedmetadata", handleLoadedMetadata);
            video.addEventListener("play", handlePlay);
            video.addEventListener("pause", handlePause);
             video.addEventListener("error", handleError);
            video.addEventListener("waiting", handleWaiting);
              video.addEventListener("playing", handlePlaying);

              if (autoPlay) {
                  video.muted = true;
                 video.play().catch(console.error);
              }

            return () => {
                video.removeEventListener("timeupdate", handleTimeUpdate);
                 video.removeEventListener("loadedmetadata", handleLoadedMetadata);
                video.removeEventListener("play", handlePlay);
                video.removeEventListener("pause", handlePause);
                video.removeEventListener("error", handleError);
                video.removeEventListener("waiting", handleWaiting);
                 video.removeEventListener("playing", handlePlaying);
                clearTimeout(controlsTimeoutRef.current);
            };
        }, [autoPlay, src, hasPlayed, isVideoInView]);

        // Fullscreen handling
        useEffect(() => {
            const handleFullscreenChange = () => {
                setIsFullscreen(!!document.fullscreenElement);
            };

            document.addEventListener("fullscreenchange", handleFullscreenChange);
            return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
        }, []);

        // Theater mode styling
        useEffect(() => {
            if (theaterMode) {
                document.body.classList.add("overflow-hidden");
                containerRef.current?.classList.add("theater-mode");
            } else {
                document.body.classList.remove("overflow-hidden");
                containerRef.current?.classList.remove("theater-mode");
            }

            return () => {
                document.body.classList.remove("overflow-hidden");
                containerRef.current?.classList.remove("theater-mode");
            };
        }, [theaterMode]);

     

        // Controls visibility
        const handleMouseMove = useCallback(() => {
            setShowControls(true);
            clearTimeout(controlsTimeoutRef.current);
            if (!isSettingsOpen) {
                controlsTimeoutRef.current = setTimeout(() => {
                    isPlaying && setShowControls(false);
                }, 2000);
            }
        }, [isPlaying, isSettingsOpen, setShowControls]);

        // Video view tracking
        useEffect(() => {
             if (onVideoView && hasPlayed && videoRef.current) {
                 onVideoView().catch(console.error);
              }
          }, [onVideoView, hasPlayed, src]);



        // Helper functions
        const toggleMute = useCallback(() => {
           if (videoRef.current) {
              videoRef.current.muted = !isMuted;
             setIsMuted(!isMuted);
            setVolume(isMuted ? 1 : 0);
             }
         },[isMuted]);

        const toggleFullscreen = useCallback(async () => {
             try {
              isFullscreen
                ? await document.exitFullscreen()
                : await containerRef.current?.requestFullscreen();
            } catch (error) {
                console.error("Fullscreen error:", error);
            }
        }, [isFullscreen]);

         const toggleTheaterMode = useCallback(() => setTheaterMode(!theaterMode), [theaterMode]);

        const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
            if (progressRef.current && videoRef.current) {
                const rect = progressRef.current.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                videoRef.current.currentTime = pos * videoRef.current.duration;
            }
        },[]);

        const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseFloat(e.target.value);
            setVolume(value);
            if (videoRef.current) {
                videoRef.current.volume = value;
                setIsMuted(value === 0);
            }
        },[]);

        const formatTime = useCallback((time: number) => {
             const minutes = Math.floor(time / 60);
           const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        },[]);
           // Keyboard shortcuts
           useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (!videoRef.current) return;

                switch (e.key.toLowerCase()) {
                    case ' ':
                        e.preventDefault();
                        togglePlay();
                        break;
                    case 'm':
                        toggleMute();
                        break;
                    case 'f':
                        toggleFullscreen();
                        break;
                    case 't':
                        toggleTheaterMode();
                        break;
                    case 'arrowleft':
                        videoRef.current.currentTime -= 5;
                        break;
                    case 'arrowright':
                        videoRef.current.currentTime += 5;
                        break;
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }, [togglePlay, toggleMute, toggleFullscreen, toggleTheaterMode]);

        return (
            <TooltipProvider delayDuration={0}>
                <div
                    ref={containerRef}
                    className={cn(
                        "group relative bg-black rounded-lg transition-all duration-300 ease-in-out overflow-hidden",
                         !isFullscreen && `aspect-[${aspectRatio}]`,  // Added this line
                        isFullscreen && "fixed inset-0 z-50 overflow-visible",
                        className
                    )}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => !isSettingsOpen && setShowControls(false)}
                >
                    {/* Aspect Ratio Container (Using padding hack) */}
                    <div
                         className={cn("relative w-full h-full", isFullscreen && "absolute inset-0")}
                        style={{
                           paddingBottom: `${(1 / aspectRatio) * 100}%`, // Calculate padding
                        }}

                    >
                        {/* Loading and error states */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                            </div>
                        )}

                        {isBuffering && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                                <div className="text-white">Buffering...</div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-50 gap-4">
                                <div className="text-white bg-red-500/80 px-4 py-2 rounded-lg">
                                    {error}
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => window.location.reload()}
                                >
                                    Retry
                                </Button>
                            </div>
                        )}

                        {/* Video element */}
                        {isVideoInView && (<video
                            ref={videoRef}
                            className="absolute top-0 left-0 w-full h-full object-contain"
                            poster={poster}
                            onClick={togglePlay}
                            muted={muted}
                            loop={loop}
                            preload={autoPlay ? "auto" : "metadata"}
                            width={width}
                            height={height}
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        >
                            <source src={src} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                        )}
                      {!isVideoInView && (<div className="absolute top-0 left-0 w-full h-full object-contain bg-black/80"></div>)}
                    </div>

                    {/* Play/pause overlay */}
                    <button
                        className={cn(
                            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ",
                            "w-16 h-16 rounded-full bg-black/50 flex items-center justify-center",
                            "transition-opacity duration-200",
                            (isPlaying || !showControls) && "opacity-0 group-hover:opacity-100"
                        )}
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <Pause className="w-8 h-8 text-white" />
                        ) : (
                            <Play className="w-8 h-8 text-white ml-1" />
                        )}
                    </button>

                    {/* Controls overlay */}
                    <div
                        className={cn(
                            "absolute bottom-0 left-0 right-0",
                            "bg-gradient-to-t from-black/80 to-transparent",
                            "px-4 pb-4 pt-8",
                            "transition-opacity duration-200",
                            !showControls && "opacity-0"
                        )}
                    >
                        {/* Progress bar */}
                        <div
                            ref={progressRef}
                            className="relative h-1 mb-4 cursor-pointer group/progress"
                            onClick={handleProgressClick}
                        >
                            <div className="absolute inset-0 bg-white/30 rounded-full">
                                <div
                                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100 group-hover/progress:bg-red-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {/* Play controls */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={togglePlay}
                                            aria-label={isPlaying ? "Pause" : "Play"}
                                        >
                                            {isPlaying ? (
                                                <Pause className="h-4 w-4" />
                                            ) : (
                                                <Play className="h-4 w-4 ml-0.5" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {isPlaying ? "Pause (k)" : "Play (k)"}
                                    </TooltipContent>
                                </Tooltip>

                                {/* Skip controls */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Rewind 10s</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={() => videoRef.current && (videoRef.current.currentTime += 10)}
                                        >
                                            <RotateCw className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Forward 10s</TooltipContent>
                                </Tooltip>

                                {/* Volume controls */}
                                <div className="flex items-center gap-2 group/volume">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-white hover:bg-white/20"
                                                onClick={toggleMute}
                                                aria-label={isMuted ? "Unmute" : "Mute"}
                                            >
                                                {isMuted || volume === 0 ? (
                                                    <VolumeX className="h-4 w-4" />
                                                ) : (
                                                    <Volume2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            {isMuted ? "Unmute (m)" : "Mute (m)"}
                                        </TooltipContent>
                                    </Tooltip>
                                    <div className="opacity-0 group-hover/volume:opacity-100 transition-opacity">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            className="w-20 accent-white"
                                            aria-label="Volume control"
                                        />
                                    </div>
                                </div>

                                {/* Time display */}
                                <div className="text-sm text-white space-x-1">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>/</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Right-side controls */}
                            <div className="flex items-center gap-2 ml-auto">
                                {/* Settings dropdown */}
                                <DropdownMenu
                                    modal={false} // Add this prop to disable the portal
                                    onOpenChange={(open) => {
                                        setIsSettingsOpen(open);
                                        open && setShowControls(true);
                                    }}
                                >
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            ref={settingsButtonRef}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            aria-label="Settings"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        side="top"
                                        sideOffset={12}
                                        className="w-56 bg-black/90 border-white/20 z-[1002]"
                                    >
                                        <div className="py-2">
                                            <p className="font-medium text-sm px-2 py-1 text-white">
                                                Playback Speed
                                            </p>
                                            {[0.75, 1, 1.25].map((speed) => (
                                                <DropdownMenuItem
                                                    key={speed}
                                                    onClick={() => {
                                                        videoRef.current!.playbackRate = speed;
                                                        setPlaybackSpeed(speed);
                                                    }}
                                                    className="text-white hover:bg-white/20"
                                                >
                                                    <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                                                    {playbackSpeed === speed && <span className="ml-auto">✓</span>}
                                                </DropdownMenuItem>
                                            ))}

                                            <Separator className="my-1 bg-white/20" />

                                            <p className="font-medium text-sm px-2 py-1 text-white">Quality</p>
                                            {['auto', '720p', '360p'].map((q) => (
                                                <DropdownMenuItem
                                                    key={q}
                                                    onClick={() => setQuality(q)}
                                                    className="text-white hover:bg-white/20"
                                                >
                                                    <span>{q}</span>
                                                    {quality === q && <span className="ml-auto">✓</span>}
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={toggleTheaterMode}
                                        >
                                            {theaterMode ? (
                                                <Minimize className="h-4 w-4" />
                                            ) : (
                                                <Maximize className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {theaterMode ? "Exit theater mode (t)" : "Theater mode (t)"}
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={togglePictureInPicture}
                                        >
                                            <PictureInPicture className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        Picture-in-picture
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={toggleFullscreen}
                                        >
                                            {isFullscreen ? (
                                                <Minimize className="h-4 w-4" />
                                            ) : (
                                                <Maximize className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {isFullscreen ? "Exit full screen (f)" : "Full screen (f)"}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        );
    }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;