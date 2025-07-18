// src/components/video-player.tsx

import React, {
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useCallback,
} from "react";
import {
    Play, Pause, Volume2, VolumeX, Settings,
    Maximize, Minimize, RotateCcw, RotateCw, PictureInPicture
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

// ------------------------------------------

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
    aspectRatio?: number; // e.g. 16/9
}

export type VideoPlayerRef = {
    toggle: () => void;
    play: () => void;
    pause: () => void;
};

// ------------------------------------------

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
            aspectRatio = 16 / 9,
        },
        ref
    ) => {

        // --- refs, state ---
        const videoRef = useRef<HTMLVideoElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const progressRef = useRef<HTMLDivElement>(null);
        const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        // Video State
        const [isPlaying, setIsPlaying] = useState(false);
        const [hasPlayed, setHasPlayed] = useState(false);
        const [isVideoInView, setIsVideoInView] = useState(false);
        const [progress, setProgress] = useState(0);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(0);
        const [volume, setVolume] = useState<number>(1);
        const [isMuted, setIsMuted] = useState(muted);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [showControls, setShowControls] = useState(true);
        const [theaterMode, setTheaterMode] = useState(false);
        const [playbackSpeed, setPlaybackSpeed] = useState(1);
        const [quality, setQuality] = useState("auto");
        const [isSettingsOpen, setIsSettingsOpen] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [isBuffering, setIsBuffering] = useState(false);

        // ------------------------------------------
        // --- Intersection Observer to lazy-load video ---
        useEffect(() => {
            const observer = new window.IntersectionObserver(
                (entries, obs) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setIsVideoInView(true);
                            obs.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.2 }
            );
            if (containerRef.current) {
                observer.observe(containerRef.current);
            }
            return () => {
                if (containerRef.current) {
                    observer.unobserve(containerRef.current);
                }
            }
        }, []);

        // --- Video Event Handlers ---
        useEffect(() => {
            const video = videoRef.current;
            if (!video || !isVideoInView) return;

            const onTimeUpdate = () => {
                if (video.duration > 0) {
                    setProgress((video.currentTime / video.duration) * 100);
                }
                setCurrentTime(video.currentTime);
            };
            const onLoadedMetadata = () => {
                setDuration(video.duration || 0);
                setIsLoading(false);
            };
            const onPlay = () => {
                setIsPlaying(true);
                setHasPlayed(true);
                setIsLoading(false);
                setIsBuffering(false);
            };
            const onPause = () => setIsPlaying(false);
            const onError = () => setError("Error loading video");
            const onWaiting = () => setIsBuffering(true);
            const onPlaying = () => setIsBuffering(false);

            video.addEventListener("timeupdate", onTimeUpdate);
            video.addEventListener("loadedmetadata", onLoadedMetadata);
            video.addEventListener("play", onPlay);
            video.addEventListener("pause", onPause);
            video.addEventListener("error", onError);
            video.addEventListener("waiting", onWaiting);
            video.addEventListener("playing", onPlaying);

            // Start video muted if autoPlay
            if (autoPlay && hasPlayed === false) {
                video.muted = true;
                video.play().catch(() => {});
            }

            return () => {
                video.removeEventListener("timeupdate", onTimeUpdate);
                video.removeEventListener("loadedmetadata", onLoadedMetadata);
                video.removeEventListener("play", onPlay);
                video.removeEventListener("pause", onPause);
                video.removeEventListener("error", onError);
                video.removeEventListener("waiting", onWaiting);
                video.removeEventListener("playing", onPlaying);
                if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            };
        }, [autoPlay, src, hasPlayed, isVideoInView]);

        // --- View tracking on first play ---
        useEffect(() => {
            if (onVideoView && hasPlayed) {
                onVideoView().catch(() => {});
            }
        }, [onVideoView, hasPlayed, src]);

        // --- Fullscreen event handling ---
        useEffect(() => {
            const listener = () => {
                setIsFullscreen(!!document.fullscreenElement);
            };
            document.addEventListener("fullscreenchange", listener);
            return () => document.removeEventListener("fullscreenchange", listener);
        }, []);

        // --- Hide page scrollbar in theater mode; block scroll ---
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
            }
        }, [theaterMode]);

        // --- Controls visibility on mouse movement ---
        const handleShowControls = useCallback(() => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            if (isPlaying && !isSettingsOpen) {
                controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2300);
            }
        }, [isPlaying, isSettingsOpen]);

        // Don't hide controls if Settings open
        useEffect(() => {
            if (isSettingsOpen) setShowControls(true);
        }, [isSettingsOpen]);

        // ------------------------------------------
        // --- Handler Functions ---
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
                    .catch((err) => {
                        setIsPlaying(false);
                        setIsLoading(false);
                        setIsBuffering(false);
                        setError("Error starting playback");
                    });
            }
        }, [isPlaying]);

        const play = useCallback(() => { videoRef.current?.play(); }, []);
        const pause = useCallback(() => { videoRef.current?.pause(); }, []);
        useImperativeHandle(ref, () => ({
            toggle: togglePlay,
            play,
            pause,
        }));

        const toggleMute = useCallback(() => {
            if (!videoRef.current) return;
            const nextMuted = !isMuted;
            videoRef.current.muted = nextMuted;
            setIsMuted(nextMuted);
            if (nextMuted) setVolume(0);
            else setVolume(videoRef.current.volume || 1);
        }, [isMuted]);

        const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseFloat(e.target.value);
            setVolume(value);
            if (videoRef.current) {
                videoRef.current.volume = value;
                videoRef.current.muted = value === 0;
                setIsMuted(value === 0);
            }
        }, []);

        const formatTime = useCallback((t: number) => {
            if (isNaN(t)) return '00:00';
            const minutes = Math.floor(t / 60);
            const seconds = Math.floor(t % 60);
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        }, []);

        const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
            if (!progressRef.current || !videoRef.current) return;
            const { left, width } = progressRef.current.getBoundingClientRect();
            const clickPosition = (e.clientX - left) / width;
            if (videoRef.current.duration) {
                videoRef.current.currentTime = clickPosition * videoRef.current.duration;
            }
        }, []);

        const toggleFullscreen = useCallback(() => {
            if (!containerRef.current) return;
            try {
                if (isFullscreen) {
                    document.exitFullscreen();
                } else {
                    containerRef.current.requestFullscreen();
                }
            } catch (e) {
                // Ignore
            }
        }, [isFullscreen]);

        const toggleTheaterMode = useCallback(
            () => setTheaterMode((tm) => !tm),
            []
        );

        const togglePictureInPicture = useCallback(async () => {
            try {
                if ((document as any).pictureInPictureElement) {
                    // @ts-ignore
                    await document.exitPictureInPicture();
                } else if (videoRef.current) {
                    // @ts-ignore
                    await videoRef.current.requestPictureInPicture();
                }
            } catch (error) {
                /* handle error but don't crash */
            }
        }, []);

        // --- Handle keyboard controls ---
        useEffect(() => {
            const handler = (e: KeyboardEvent) => {
                if (!videoRef.current) return;
                if (
                    (document.activeElement &&
                        ((document.activeElement as HTMLElement).tagName === "INPUT" ||
                            (document.activeElement as HTMLElement).tagName === "TEXTAREA"))
                ) {
                    return;
                }
                switch (e.key) {
                    case " ":
                    case "k":
                        e.preventDefault();
                        togglePlay();
                        break;
                    case "m":
                        toggleMute();
                        break;
                    case "f":
                        toggleFullscreen();
                        break;
                    case "t":
                        toggleTheaterMode();
                        break;
                    case "ArrowLeft":
                        e.preventDefault();
                        videoRef.current.currentTime -= 5;
                        break;
                    case "ArrowRight":
                        e.preventDefault();
                        videoRef.current.currentTime += 5;
                        break;
                }
            };
            window.addEventListener("keydown", handler);
            return () => window.removeEventListener("keydown", handler);
        }, [togglePlay, toggleMute, toggleFullscreen, toggleTheaterMode]);

        // --- Fix settings menu inside fullscreen DOM context ---
        // On fullscreen, render with a portal, otherwise normal
        // Since the DropdownMenu library might use Portals, but DOM context may break in full screen,
        // force modal={false} and position the menu in context.

        // ------------------------------------------
        return (
            <TooltipProvider delayDuration={0}>
                <div
                    ref={containerRef}
                    className={cn(
                        "group relative bg-black rounded-lg transition-all duration-300 ease-in-out overflow-hidden",
                        isFullscreen ? "fixed inset-0 z-[9999] w-screen h-screen !aspect-auto" : "",
                        !isFullscreen && `aspect-[${aspectRatio}]`,
                        className
                    )}
                    onMouseMove={handleShowControls}
                    onMouseLeave={() => {
                        if (!isSettingsOpen && isPlaying) setShowControls(false);
                    }}
                >

                    <div
                        className={cn("relative w-full h-full", isFullscreen && "absolute inset-0")}
                        style={{
                            paddingBottom: !isFullscreen ? `${(1 / aspectRatio) * 100}%` : undefined,
                            minHeight: isFullscreen ? "100vh" : undefined,
                        }}
                    >
                        {/* Loader */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                            </div>
                        )}
                        {isBuffering && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
                                <div className="text-white text-sm">Buffering...</div>
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

                        {/* Video */}
                        {isVideoInView ? (
                            <video
                                ref={videoRef}
                                className="absolute top-0 left-0 w-full h-full object-contain"
                                poster={poster}
                                onClick={togglePlay}
                                muted={isMuted}
                                loop={loop}
                                preload={autoPlay ? "auto" : "metadata"}
                                width={width}
                                height={height}
                                tabIndex={-1}
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                            >
                                <source src={src} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="absolute top-0 left-0 w-full h-full object-contain bg-black/80" />
                        )}
                    </div>

                    {/* Play Button Overlay */}
                    <button
                        className={cn(
                            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20",
                            "w-16 h-16 rounded-full bg-black/60 flex items-center justify-center",
                            (isPlaying || !showControls) && "opacity-0 pointer-events-none",
                            "transition-opacity duration-200"
                        )}
                        tabIndex={-1}
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        style={{ outline: "none" }}
                    >
                        {isPlaying
                            ? <Pause className="w-8 h-8 text-white" />
                            : <Play className="w-8 h-8 text-white ml-1" />
                        }
                    </button>

                    {/* Controls */}
                    <div
                        className={cn(
                            "absolute bottom-0 left-0 right-0",
                            "bg-gradient-to-t from-black/85 to-transparent",
                            "px-4 pb-4 pt-8",
                            "z-30",
                            "transition-opacity duration-200",
                            !showControls && "opacity-0 pointer-events-none"
                        )}>
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
                        {/* Controls Row */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {/* Play/Pause */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={togglePlay}
                                            aria-label={isPlaying ? "Pause" : "Play"}
                                        >
                                            {isPlaying
                                                ? <Pause className="h-4 w-4" />
                                                : <Play className="h-4 w-4 ml-0.5" />
                                            }
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isPlaying ? "Pause (k)" : "Play (k)"}</TooltipContent>
                                </Tooltip>

                                {/* Rewind/Forward */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={() => {
                                                if (videoRef.current) videoRef.current.currentTime -= 10;
                                            }}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Rewind 10s</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={() => {
                                                if (videoRef.current) videoRef.current.currentTime += 10;
                                            }}
                                        >
                                            <RotateCw className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Forward 10s</TooltipContent>
                                </Tooltip>

                                {/* Volume */}
                                <div className="flex items-center gap-2 group/volume">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-white hover:bg-white/20"
                                                onClick={toggleMute}
                                                aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                                            >
                                                {isMuted || volume === 0
                                                    ? <VolumeX className="h-4 w-4" />
                                                    : <Volume2 className="h-4 w-4" />
                                                }
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {isMuted ? "Unmute (m)" : "Mute (m)"}
                                        </TooltipContent>
                                    </Tooltip>
                                    <div className="opacity-0 group-hover/volume:opacity-100 transition-opacity">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            className="w-20 accent-white"
                                            aria-label="Volume control"
                                        />
                                    </div>
                                </div>

                                {/* Time display */}
                                <div className="text-sm text-white space-x-1 select-none">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>/</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* ---- Right controls ---- */}
                            <div className="flex items-center gap-2 ml-auto">
                                {/* Settings */}
                                <DropdownMenu
                                    modal={false}
                                    onOpenChange={open => {
                                        setIsSettingsOpen(open);
                                        if (open) setShowControls(true);
                                    }}
                                >
                                    <DropdownMenuTrigger asChild>
                                        <Button
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
                                        className="w-56 bg-black/95 border-white/20 z-[1002]"
                                    >
                                        <div className="py-2">
                                            <p className="font-medium text-sm px-2 py-1 text-white">
                                                Playback Speed
                                            </p>
                                            {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                                <DropdownMenuItem
                                                    key={speed}
                                                    onClick={() => {
                                                        if (videoRef.current) videoRef.current.playbackRate = speed;
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

                                {/* Theater Mode */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={toggleTheaterMode}
                                            aria-label={theaterMode ? "Exit theater mode" : "Theater mode"}
                                        >
                                            {theaterMode
                                                ? <Minimize className="h-4 w-4" />
                                                : <Maximize className="h-4 w-4" />
                                            }
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {theaterMode ? "Exit theater mode (t)" : "Theater mode (t)"}
                                    </TooltipContent>
                                </Tooltip>

                                {/* Picture In Picture */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={togglePictureInPicture}
                                            aria-label="Picture in Picture"
                                        >
                                            <PictureInPicture className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Picture-in-picture
                                    </TooltipContent>
                                </Tooltip>

                                {/* Fullscreen */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white hover:bg-white/20"
                                            onClick={toggleFullscreen}
                                            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                        >
                                            {isFullscreen
                                                ? <Minimize className="h-4 w-4" />
                                                : <Maximize className="h-4 w-4" />
                                            }
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
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
