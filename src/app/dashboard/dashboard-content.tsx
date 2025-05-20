'use client'

import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentGrid } from "@/components/dashboard/content-grid"
import { ToastContainer } from "react-toastify"
import { useContent } from "@/hooks/use-content"
import { ContentStats } from "@/components/dashboard/content-stats"
import { ContentFilters } from "@/components/dashboard/content-filters"
import { Video, FileText, Book } from 'lucide-react'

export function DashboardContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('liked')
  const { 
    likedContent, 
    savedContent, 
    dislikedContent, 
    removeLike, 
    removeDislike, 
    removeSaved,
    isLoading 
  } = useContent()

  const [selectedDate, setSelectedDate] = useState<Date>()
  const [contentType, setContentType] = useState('all')

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  // Updated filtering logic to strictly match content types
  const filterContent = (items: any[]) => {
    return items.filter(item => {
      const matchesDate = selectedDate 
        ? new Date(item.uploadDate).toDateString() === selectedDate.toDateString()
        : true
      
      // Strict type checking
      const matchesType = contentType === 'all' 
        ? true 
        : item.type?.toLowerCase() === contentType.toLowerCase()
      
      return matchesDate && matchesType
    })
  }

  const handleRemove = async (id: string) => {
    switch (activeTab) {
      case 'liked':
        await removeLike(id)
        break
      case 'disliked':
        await removeDislike(id)
        break
      case 'saved':
        await removeSaved(id)
        break
    }
  }

  // Updated navigation logic based on content type
  // biznetwork/src/app/dashboard/dashboard-content.tsx
const handleContentClick = (item: any) => {
    if (!item?.type) {
      console.error('Content type not found:', item)
      return
    }
  
    switch (item.type.toLowerCase()) {
      case 'video':
        router.push(`/?videoId=${item.videoSlug || item._id}&activeNavItem=Videos`, { scroll: false })
        break
      case 'blog':
        router.push(`/blog/${item.slug || item._id}`)
        break
      case 'document':
        router.push(`/docs/${item.slug || item._id}`)
        break
      default:
        console.error('Unknown content type:', item.type)
    }
  }

  const getContentIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'blog':
        return <FileText className="h-4 w-4" />
      case 'document':
        return <Book className="h-4 w-4" />
      default:
        return null
    }
  }

  // Helper function to count content by type
  const getContentTypeCount = (items: any[], type: string) => {
    return items.filter(item => item.type?.toLowerCase() === type.toLowerCase()).length
  }

  return (
    <main className="container py-6 ml-4">
      <ToastContainer position="top-right" />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {session?.user?.name || "User"}
          </h1>
          <p className="text-muted-foreground">
            View and manage your liked, saved, and disliked content
          </p>
        </div>

        <ContentStats 
          likedCount={likedContent.length}
          savedCount={savedContent.length}
          dislikedCount={dislikedContent.length}
          videoCount={getContentTypeCount(likedContent.concat(savedContent, dislikedContent), 'video')}
          blogCount={getContentTypeCount(likedContent.concat(savedContent, dislikedContent), 'blog')}
          documentCount={getContentTypeCount(likedContent.concat(savedContent, dislikedContent), 'document')}
        />

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setContentType('all')}
              className={`px-4 py-2 rounded-lg ${
                contentType === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setContentType('video')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                contentType === 'video' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary'
              }`}
            >
              <Video className="h-4 w-4" />
              Videos ({getContentTypeCount(
                activeTab === 'liked' 
                  ? likedContent 
                  : activeTab === 'saved' 
                    ? savedContent 
                    : dislikedContent,
                'video'
              )})
            </button>
            <button
              onClick={() => setContentType('blog')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                contentType === 'blog' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary'
              }`}
            >
              <FileText className="h-4 w-4" />
              Blogs ({getContentTypeCount(
                activeTab === 'liked' 
                  ? likedContent 
                  : activeTab === 'saved' 
                    ? savedContent 
                    : dislikedContent,
                'blog'
              )})
            </button>
            <button
              onClick={() => setContentType('document')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                contentType === 'document' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary'
              }`}
            >
              <Book className="h-4 w-4" />
              Documents ({getContentTypeCount(
                activeTab === 'liked' 
                  ? likedContent 
                  : activeTab === 'saved' 
                    ? savedContent 
                    : dislikedContent,
                'document'
              )})
            </button>
          </div>

          <ContentFilters
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onTypeFilter={setContentType}
          />
        </div>

        <Tabs defaultValue="liked" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="liked">Liked</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="disliked">Disliked</TabsTrigger>
          </TabsList>
          <TabsContent value="liked">
            <ContentGrid 
              items={filterContent(likedContent)}
              onRemove={handleRemove}
              onItemClick={handleContentClick}
              getIcon={getContentIcon}
              isLoading={isLoading}
              activeTab={activeTab}
            />
          </TabsContent>
          <TabsContent value="saved">
            <ContentGrid 
              items={filterContent(savedContent)}
              onRemove={handleRemove}
              onItemClick={handleContentClick}
              getIcon={getContentIcon}
              isLoading={isLoading}
              activeTab={activeTab}
            />
          </TabsContent>
          <TabsContent value="disliked">
            <ContentGrid 
              items={filterContent(dislikedContent)}
              onRemove={handleRemove}
              onItemClick={handleContentClick}
              getIcon={getContentIcon}
              isLoading={isLoading}
              activeTab={activeTab}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}