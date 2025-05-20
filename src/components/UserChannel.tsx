'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface Channel {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  subscribersCount: number;
  videosCount: number;
}

interface Video {
  id: string;
  title: string;
  views: number;
  likes: number;
  uploadDate: string;
}

export default function UserChannel() {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedChannel, setEditedChannel] = useState<Partial<Channel>>({})
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch channel data
    const fetchChannelData = async () => {
      try {
        const response = await fetch('/api/channel')
        if (!response.ok) throw new Error('Failed to fetch channel data')
        const data = await response.json()
        setChannel(data)
        setVideos(data.videos || [])
      } catch (error) {
        console.error('Error fetching channel data:', error)
        toast({
          title: "Error",
          description: "Failed to load channel data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchChannelData()
  }, [])

  const handleEditChannel = () => {
    setIsEditing(true)
    setEditedChannel({ ...channel })
  }

  const handleSaveChannel = async () => {
    try {
      const response = await fetch('/api/channel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedChannel),
      })
      if (!response.ok) throw new Error('Failed to update channel')
      const updatedChannel = await response.json()
      setChannel(updatedChannel)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Channel updated successfully.",
      })
    } catch (error) {
      console.error('Error updating channel:', error)
      toast({
        title: "Error",
        description: "Failed to update channel. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditVideo = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleUpdateVideo = async (updatedVideo: Video) => {
    try {
      const response = await fetch(`/api/videos/${updatedVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVideo),
      })
      if (!response.ok) throw new Error('Failed to update video')
      const updatedVideos = videos.map(v => v.id === updatedVideo.id ? updatedVideo : v)
      setVideos(updatedVideos)
      setSelectedVideo(null)
      toast({
        title: "Success",
        description: "Video updated successfully.",
      })
    } catch (error) {
      console.error('Error updating video:', error)
      toast({
        title: "Error",
        description: "Failed to update video. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!channel) return <div>Loading channel data...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Channel Information</CardTitle>
          <CardDescription>Manage your channel details and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={channel.photoUrl} alt={channel.name} />
              <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="channelName">Channel Name</Label>
                  <Input
                    id="channelName"
                    value={editedChannel.name || ''}
                    onChange={(e) => setEditedChannel({ ...editedChannel, name: e.target.value })}
                  />
                  <Label htmlFor="channelDescription">Description</Label>
                  <Textarea
                    id="channelDescription"
                    value={editedChannel.description || ''}
                    onChange={(e) => setEditedChannel({ ...editedChannel, description: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{channel.name}</h2>
                  <p className="text-gray-500">{channel.description}</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Subscribers: {channel.subscribersCount}</p>
              <p className="text-sm text-gray-500">Videos: {channel.videosCount}</p>
            </div>
            {isEditing ? (
              <Button onClick={handleSaveChannel}>Save Changes</Button>
            ) : (
              <Button onClick={handleEditChannel}>Edit Channel</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Videos</CardTitle>
          <CardDescription>Edit and update your uploaded videos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>{video.title}</TableCell>
                  <TableCell>{video.views}</TableCell>
                  <TableCell>{video.likes}</TableCell>
                  <TableCell>{new Date(video.uploadDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEditVideo(video)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Video</DialogTitle>
                          <DialogDescription>Make changes to your video details here.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="videoTitle">Title</Label>
                            <Input
                              id="videoTitle"
                              value={selectedVideo?.title || ''}
                              onChange={(e) => setSelectedVideo({ ...selectedVideo!, title: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleUpdateVideo(selectedVideo!)}>Save changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}