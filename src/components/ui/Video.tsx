import React from 'react'

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  poster?: string
}

export const Video = React.forwardRef<HTMLVideoElement, VideoProps>(
  ({ className, poster, ...props }, ref) => {
    return (
      <video
        className={className}
        poster={poster}
        ref={ref}
        {...props}
      />
    )
  }
)

Video.displayName = 'Video'

