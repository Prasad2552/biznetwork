//src\components\video-section.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Play, ThumbsUp, ThumbsDown, Share, MoreHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ReactPlayer from "react-player";

interface Video {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  dislikes: number;
  channel: string;
  uploadDate: string;
  duration: string;
  commentCount: number;
   channelLogo: string
}

interface Comment {
  _id: string;
  userId: string;
  username: string;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: string;
  replies: Comment[];
}

interface VideoSectionProps {
  token: string | null;
  isLoggedIn: boolean;
}

export function VideoSection({ token, isLoggedIn }: VideoSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos/display')
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      } else {
        console.error('Failed to fetch videos')
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  }

  const handleVideoView = async (videoId: string) => {
    if (!selectedVideo || selectedVideo._id !== videoId) {
        try {
            const response = await fetch(`/api/videos/${videoId}/view`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
        })
          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.error || response.statusText;
            throw new Error(`Failed to update video view count: ${errorMessage}`);
          }
          const data = await response.json()
          setVideos(prevVideos =>
            prevVideos.map(video =>
                video._id === videoId ? { ...video, views: data.views } : video
              )
            )
        } catch (error) {
            console.error('Error updating video view count:', error)
            alert(`Error updating view count: ${error}`);
        }
      }
}

    const handleLike = async (videoId: string) => {
      if (!isLoggedIn) {
        alert('Please log in to like videos')
        return
      }
      try {
        const response = await fetch(`/api/videos/[videoId]/${videoId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
         if (!response.ok) {
          const errorData = await response.json();
             const errorMessage = errorData?.error || response.statusText;
          throw new Error(`Failed to like video: ${errorMessage}`);
        }
        const data = await response.json()
        setVideos(prevVideos =>
          prevVideos.map(video =>
            video._id === videoId ? { ...video, likes: data.likes, dislikes: data.dislikes } : video
          )
        )
       setSelectedVideo((prevVideo) => {
         if(prevVideo && prevVideo._id === videoId){
           return { ...prevVideo, likes: data.likes, dislikes:data.dislikes }
         }
          return prevVideo;
         }
        )
      } catch (error) {
        console.error('Error liking video:', error)
         alert(`Error liking video: ${error}`);
      }
    }

  const handleDislike = async (videoId: string) => {
    if (!isLoggedIn) {
      alert('Please log in to dislike videos')
      return
    }
      try {
          const response = await fetch(`/api/videos/[videoId]/${videoId}/dislike`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
        })
         if (!response.ok) {
          const errorData = await response.json();
             const errorMessage = errorData?.error || response.statusText;
          throw new Error(`Failed to dislike video: ${errorMessage}`);
        }
        const data = await response.json()
          setVideos(prevVideos =>
            prevVideos.map(video =>
              video._id === videoId ? { ...video, likes: data.likes, dislikes: data.dislikes } : video
            )
          )
       setSelectedVideo((prevVideo) => {
         if(prevVideo && prevVideo._id === videoId){
           return { ...prevVideo, likes: data.likes, dislikes:data.dislikes }
         }
          return prevVideo;
         }
        )
      } catch (error) {
          console.error('Error disliking video:', error);
          alert(`Error disliking video: ${error}`);
      }
  }

  const handleCommentSubmit = async (videoId: string) => {
      if (!isLoggedIn) {
        alert('Please log in to comment')
        return
      }
    try {
        const response = await fetch(`/api/videos/[videoId]/${videoId}/comments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
             body: JSON.stringify({ content: newComment }),
          })
         if (!response.ok) {
          const errorData = await response.json();
             const errorMessage = errorData?.error || response.statusText;
          throw new Error(`Failed to submit comment: ${errorMessage}`);
        }
       const data = await response.json()
       setComments(prevComments => [data, ...prevComments])
      setNewComment('')
          setVideos(prevVideos =>
            prevVideos.map(video =>
              video._id === videoId ? { ...video, commentCount: video.commentCount + 1 } : video
            )
        )
           setSelectedVideo((prevVideo) => {
             if(prevVideo && prevVideo._id === videoId){
               return { ...prevVideo, commentCount:prevVideo.commentCount + 1 }
             }
              return prevVideo;
            }
          )
    } catch (error) {
        console.error('Error submitting comment:', error)
        alert(`Error submitting comment: ${error}`);
    }
  }

  const fetchComments = async (videoId: string) => {
    try {
      setLoadingComments(true)
      setCommentError(null)
      const response = await fetch(`/api/videos/[videoId]/${videoId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
       if (!response.ok) {
         const errorData = await response.json();
            const errorMessage = errorData?.error || response.statusText;
        throw new Error(`Failed to fetch comments: ${errorMessage}`);
      }
      const data = await response.json()
      setComments(data.comments)
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video._id === videoId ? { ...video, commentCount: data.commentCount } : video
        )
      )
     setSelectedVideo((prevVideo) => {
           if(prevVideo && prevVideo._id === videoId){
               return { ...prevVideo, commentCount: data.commentCount }
           }
              return prevVideo;
         }
      )
    } catch (error) {
      console.error('Error fetching comments:', error)
      setCommentError('Failed to load comments. Please try again.')
      alert(`Error fetching comments: ${error}`);
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    if (selectedVideo) {
      fetchComments(selectedVideo._id)
    }
  }, [selectedVideo])

  return (
    selectedVideo === null ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div
          key={video._id}
          className="relative group cursor-pointer"
          onClick={() => setSelectedVideo(video)}
        >
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200">
            <Image
              src={video.thumbnailUrl || '/placeholder.svg'}
              alt="Video thumbnail"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
              {video.duration}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                <Play className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex">
            <Avatar className="w-8 h-8 mr-3">
              <AvatarImage src={video.channelLogo || "/placeholder.svg"} alt="Channel Avatar" />
              <AvatarFallback>{video.channel?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{video.title}</h3>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <span>{video.channel}</span>
                <span className="mx-1">•</span>
                <span>{video.views} views</span>
                  <span className="mx-1">•</span>
                  <span>{video.uploadDate}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
      {selectedVideo && (
        <VideoPlayer
          src={selectedVideo.videoUrl}
          poster={selectedVideo.thumbnailUrl}
          onVideoView={() => handleVideoView(selectedVideo._id)}
          onLike={() => handleLike(selectedVideo._id)}
          onDislike={() => handleDislike(selectedVideo._id)}
        />
        )}
        <div className="mt-4">
          <h2 className="text-2xl font-bold">{selectedVideo?.title}</h2>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4">
               <Avatar>
                    <AvatarImage src={selectedVideo?.channelLogo || "/placeholder.svg"} alt="Channel Avatar" />
                  <AvatarFallback>CH</AvatarFallback>
               </Avatar>
              <div>
                <p className="font-semibold">{selectedVideo?.channel}</p>
                <p className="text-sm text-gray-500">1M subscribers</p>
              </div>
              <Button variant="default" className="bg-red-600 hover:bg-red-700 text-white">
                Subscribe
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className={`flex items-center space-x-1 ${selectedVideo?.likes > 0 ? 'bg-blue-100 text-blue-600' : ''}`}
                onClick={() => handleLike(selectedVideo._id)}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{selectedVideo?.likes}</span>
              </Button>
              <Button 
                variant="outline" 
                className={`flex items-center space-x-1 ${selectedVideo?.dislikes > 0 ? 'bg-blue-100 text-blue-600' : ''}`}
                onClick={() => handleDislike(selectedVideo._id)}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{selectedVideo?.dislikes}</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-1">
                <Share className="w-4 h-4" />
                <span>Share</span>
              </Button>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm">{selectedVideo?.description}</p>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">{selectedVideo?.commentCount} Comments</h3>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar>
              <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => handleCommentSubmit(selectedVideo._id)}>Comment</Button>
          </div>
          {loadingComments && <p>Loading comments...</p>}
          {commentError && <p className="text-red-500">{commentError}</p>}
          {!loadingComments && !commentError && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex space-x-4">
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" alt={comment.username} />
                    <AvatarFallback>{comment.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{comment.username}</p>
                    <p>{comment.content}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {comment.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        {comment.dislikes}
                      </Button>
                      <Button variant="ghost" size="sm">Reply</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="w-full md:w-80">
        <h3 className="text-lg font-semibold mb-2">Up Next</h3>
        <div className="space-y-4">
          {videos.filter(v => v._id !== selectedVideo?._id).slice(0, 5).map((video) => (
            <div key={video._id} className="flex space-x-2 cursor-pointer" onClick={() => setSelectedVideo(video)}>
              <div className="relative w-40 h-24">
                <Image
                  src={video.thumbnailUrl || '/placeholder.svg'}
                  alt="Thumbnail"
                  fill
                  className="rounded object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div>
                <h4 className="font-semibold">{video.title}</h4>
                <p className="text-sm text-gray-500">{video.channel}</p>
                <p className="text-sm text-gray-500">{video.views} views • {video.uploadDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
)}
