// src/components/video-player.tsx

"use client";

import React, { forwardRef } from "react";
import {
  Player,
  Video,
  DefaultUi,
  DefaultSettings,
  DefaultControls,
  DefaultSpinner,
} from "@vime/react";
import "@vime/core/themes/default.css";

// Optionally accept props, for example:
interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  aspectRatio?: string; // e.g. "16:9"
}

const VideoPlayer = forwardRef<any, VideoPlayerProps>(
  ({ src, poster, autoPlay = false, aspectRatio = "16:9" }, ref) => (
    <div style={{
      width: "100%",
      maxWidth: "100%",
      aspectRatio,
      background: "#000"
    }}>
      <Player
        controls
        autoplay={autoPlay}
        poster={poster}
        theme="default"
        aspectRatio={aspectRatio}
        ref={ref}
        style={{ width: "100%", height: "100%" }}
      >
        <Video crossOrigin="" poster={poster}>
          <source data-src={src} src={src} type="video/mp4" />
        </Video>
        <DefaultUi />
      </Player>
    </div>
  )
);

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;
