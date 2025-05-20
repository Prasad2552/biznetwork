'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Icons } from "@/components/ui/icons"
import { toast } from "sonner"

interface ContentData {
  _id: string
  title: string
  description?: string
  status: 'draft' | 'published'
  videoUrl?: string
  thumbnailUrl?: string
  categories?: string[]
  duration?: number
}


export default function EditContent() {
  const params = useParams()
  const router = useRouter()
  const [content, setContent] = useState<ContentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const channelId = params?.channelId ? params.channelId as string : "";
  const type = params?.type ? params.type as string : "";
  const id = params?.id ? params.id as string : "";


  useEffect(() => {
    const fetchContent = async () => {
      if (!id || !type) return

      try {
        const response = await fetch(`/api/admin/content/${type}/${id}`)
        if (!response.ok) throw new Error('Failed to fetch content')
        const data = await response.json()
        setContent(data)
      } catch (error) {
        toast.error('Failed to load content')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [id, type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content || !type || !id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/content/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      })

      if (!response.ok) throw new Error('Failed to update content')
      toast.success('Content updated successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to update content')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!type || !id) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/content/${type}/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete content')
      toast.success('Content deleted successfully')
      router.push(`/admin/dashboard/${channelId}/content`)
    } catch (error) {
      toast.error('Failed to delete content')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-8 w-1/3 bg-muted animate-pulse rounded" />
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Content not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit {type}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={content.description || ''}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                rows={4}
              />
            </div>


            {content.videoUrl && ( // Conditionally render Video URL field
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={content.videoUrl}
                  onChange={(e) => setContent({ ...content, videoUrl: e.target.value })}
                />
              </div>
            )}



            <div className="flex justify-between items-center pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    Delete Content
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this content.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}