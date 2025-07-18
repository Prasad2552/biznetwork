// src/components/video-player.tsx

"use client";
import React, { useRef } from "react";
import ReactPlayer from "react-player/lazy"; // lazy-loads player code

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  aspectRatio?: string; // e.g. "16:9" or "4:3"
  className?: string; // <-- ADD THIS LINE
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  controls = true,
  width = "100%",
  height = "100%",
  aspectRatio = "16:9",
  className, 
}) => {
 const aspect = aspectRatio.split(":").map(Number);
  const paddingTop = aspect.length === 2 ? (aspect[1] / aspect[0]) * 100 : 56.25;

 return (
    <div
      className={className} // <--- assign it here!
      style={{
        position: "relative",
        width,
        maxWidth: "100%",
        paddingTop: `${paddingTop}%`,
        background: "#000",
      }}
    >
      <ReactPlayer
        url={src}
        playing={autoPlay}
        controls={controls}
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
        light={poster}
        config={{
          file: {
            attributes: {
              poster: poster,
            },
          },
        }}
      />
    </div>
  );
};

export default VideoPlayer;
