//src\app\admin\dashboard\[channelId]\content\page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface ContentItem {
  _id: string
  title: string
  type: string
  createdAt: string
}

const contentTypeIcons: { [key: string]: React.ElementType } = {
  videos: Icons.video,
  blogs: Icons.fileText,
  webinars: Icons.monitor,
  podcasts: Icons.mic,
  caseStudies: Icons.briefcase,
  infographics: Icons.image,
  whitePapers: Icons.file,
  testimonials: Icons.userCheck,
  ebooks: Icons.book,
  demos: Icons.play,
  events: Icons.calendar
}

function ContentSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}

export default function UploadedContent() {
  const params = useParams()
  const channelId = params?.channelId as string
  const [content, setContent] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/admin/channels/${channelId}/content`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch content')
        }
        
        const data = await response.json()
        
        // Validate the data structure
        if (Array.isArray(data)) {
          setContent(data)
        } else {
          throw new Error('Invalid data format received')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching content:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (channelId) {
      fetchContent()
    }
  }, [channelId])

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Uploaded Content</h1>
        <Button asChild>
          <Link href={`/admin/dashboard/${channelId}/upload`}>
            Upload New Content
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <ContentSkeleton />
        ) : content.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No content found for this channel.</p>
            <Button asChild className="mt-4">
              <Link href={`/admin/dashboard/${channelId}/upload`}>
                Upload Your First Content
              </Link>
            </Button>
          </div>
        ) : (
          content.map((item) => {
            const Icon = contentTypeIcons[item.type] || Icons.file
            return (
              <Card key={item._id}>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <Button asChild size="sm">
                    <Link href={`/admin/dashboard/${channelId}/content/${item.type}/${item._id}`}>
                      Edit Content
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

