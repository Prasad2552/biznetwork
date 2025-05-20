// src/app/admin/dashboard/[channelId]/upload/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Video, FileText, Headphones, FileQuestion, Image, FileSpreadsheet, MessageSquare, Book, Play, Calendar, Menu, Monitor, Newspaper, Film } from 'lucide-react' // Added Film icon for Shorts
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import VideoUpload from '@/app/api/video-upload/video-upload'
import BlogPostUpload from '@/app/api/blog-upload/blog-upload'
import PDFUpload from '@/app/api/pdf-upload/pdf-upload'

export default function Dashboard() {
  const params = useParams()
  const channelId = params?.channelId as string
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [channelData, setChannelData] = useState<any>({ name: 'Loading...' });
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        const response = await fetch(`/api/admin/channels/${channelId}`)
        if (response.ok) {
          const data = await response.json()
          setChannelData(data)
        } else {
          throw new Error('Failed to fetch channel data')
        }
      } catch (error) {
        console.error('Error fetching channel data:', error)
      }
    }

    fetchChannelData()
  }, [channelId])

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', href: `/admin/dashboard/${channelId}` },
    { icon: Video, label: 'Videos', href: `/admin/dashboard/${channelId}/video-upload` },
    { icon: Film, label: 'Shorts', href: `/admin/dashboard/${channelId}/shorts` }, // Added Shorts
    { icon: Monitor, label: 'Webinars', href: `/admin/dashboard/${channelId}/webinars` },
    { icon: FileText, label: 'Blog Posts', href: `/admin/dashboard/${channelId}/blog-upload` },
    { icon: Newspaper, label: 'Tech News', href: `/admin/dashboard/${channelId}/tech-news` }, // Added Tech News
    { icon: Headphones, label: 'Podcasts', href: `/admin/dashboard/${channelId}/podcasts` },
    { icon: FileQuestion, label: 'case-studies', href: `api/dashboard/${channelId}/case-studies` },
    { icon: Image, label: 'Infographics', href: `/admin/dashboard/${channelId}/infographics` },
    { icon: FileSpreadsheet, label: 'White Papers', href: `/admin/dashboard/${channelId}/white-papers` },
    { icon: MessageSquare, label: 'Testimonials', href: `/admin/dashboard/${channelId}/testimonials` },
    { icon: Book, label: 'E-books', href: `/admin/dashboard/${channelId}/e-books` },
    { icon: Play, label: 'Demos', href: `/admin/dashboard/${channelId}/demos` },
    { icon: Calendar, label: 'Events', href: `/admin/dashboard/${channelId}/events` },
    
  ];

  const handleContentTypeClick = (type: string) => {
    const lowerCaseType = type.toLowerCase(); // Get lowercase type
    setSelectedContentType(lowerCaseType); // Set lowercase

    switch (lowerCaseType) { // Use lowercase type in the switch
      case 'videos':
        setSelectedContentType('videos');
        break;
      case 'webinars':
        setSelectedContentType('webinars');
        break;
      case 'podcasts':
        setSelectedContentType('podcasts');
        break;
      case 'testimonials':
        setSelectedContentType('testimonials');
        break;
      case 'demos':
        setSelectedContentType('demos');
        break;
      case 'events':
        setSelectedContentType('events');
        break;
      case 'shorts':  // Added Shorts
        setSelectedContentType('shorts'); // Added Shorts
        break;
      case 'blog posts':
        setSelectedContentType('blog posts');
        break;
      case 'tech news': // Added tech news
        setSelectedContentType('tech news'); // Added tech news
        break;
      case 'case-studies': // lowercase here
        setSelectedContentType('case-studies'); // lowercase here
        break;
      case 'e-books':
        setSelectedContentType('ebooks');
        break;
      case 'infographics':
        setSelectedContentType('infographics');
        break;
      case 'white papers':
        setSelectedContentType('whitepapers');
        break;
    }
  };


  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center">
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          <Link href={`/admin/dashboard/${channelId}`} className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BizNetwork Studio</span>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          <h1 className="mb-4 text-2xl font-bold">
            {channelData.name} Dashboard
          </h1>
          <Tabs defaultValue="upload" className="mt-6">
            <TabsList>
              <TabsTrigger value="upload">Upload Content</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Content</CardTitle>
                  <CardDescription>Choose the type of content you want to upload</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedContentType ? (
                    <>
                      {selectedContentType === 'videos' && <VideoUpload channelId={channelId} />}
                      {selectedContentType === 'webinars' && <VideoUpload channelId={channelId} contentType="webinars" />}
                      {selectedContentType === 'podcasts' && <VideoUpload channelId={channelId} contentType="podcasts" />}
                      {selectedContentType === 'testimonials' && <VideoUpload channelId={channelId} contentType="testimonials" />}
                      {selectedContentType === 'demos' && <VideoUpload channelId={channelId} contentType="demos" />}
                      {selectedContentType === 'events' && <VideoUpload channelId={channelId} contentType="events" />}
                      {selectedContentType === 'shorts' && <VideoUpload channelId={channelId} contentType="shorts" />}  {/* Added Shorts */}
                      {selectedContentType === 'blog posts' && <BlogPostUpload channelId={channelId} />}
                      {selectedContentType === 'tech news' && <BlogPostUpload channelId={channelId} isTechNews={true} />}
                      {(selectedContentType === 'ebooks' ||
                        selectedContentType === 'infographics' ||
                        selectedContentType === 'case-studies' ||
                        selectedContentType === 'whitepapers') && <PDFUpload channelId={channelId} />}
                      <Button
                        variant="outline"
                        onClick={() => setSelectedContentType(null)}
                        className="mt-4"
                      >
                        Back to content selection
                      </Button>
                    </>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sidebarItems.slice(1,).map((item, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-20 flex-col"
                          onClick={() => handleContentTypeClick(item.label)}
                        >
                          <item.icon className="mb-2 h-6 w-6" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}