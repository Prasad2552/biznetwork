'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Editor } from '@tinymce/tinymce-react'
import type { EditorRef } from '@/types/editor'

interface BlogPost {
  _id: string
  title: string
  content: string
  author: string
  tags: string
  featuredImage?: string
}

export default function EditBlogPost({ params }: { params: { id: string } }) {
  const { id } = params
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newFeaturedImage, setNewFeaturedImage] = useState<File | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const editorRef = useRef<EditorRef | null>(null)

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        const response = await fetch(`/api/blog/posts/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch blog post')
        }
        const data = await response.json()
        setBlogPost(data)
      } catch (error) {
        console.error('Error fetching blog post:', error)
        toast({
          title: "Error",
          description: "Failed to fetch blog post. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchBlogPost()
  }, [id, toast])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', blogPost!.title)
      formData.append('content', editorRef.current?.getContent() || '')
      formData.append('author', blogPost!.author)
      formData.append('tags', blogPost!.tags)
      if (newFeaturedImage) {
        formData.append('featuredImage', newFeaturedImage)
      }

      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update blog post')
      }

      toast({
        title: "Success",
        description: "Blog post updated successfully.",
      })
      router.push('/dashboard/blog-posts')
    } catch (error) {
      console.error('Error updating blog post:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update blog post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setBlogPost(prev => ({ ...prev!, [name]: value }))
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setNewFeaturedImage(event.target.files[0])
    }
  }

  if (!blogPost) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Blog Post</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={blogPost.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="featuredImage">Featured Image</Label>
              <Input
                id="featuredImage"
                name="featuredImage"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
              />
              {(blogPost.featuredImage || newFeaturedImage) && (
                <div className="relative w-full h-64">
                  <Image 
                    src={newFeaturedImage ? URL.createObjectURL(newFeaturedImage) : blogPost.featuredImage!}
                    alt={blogPost.title} 
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Editor
               apiKey="oxpar47sm2yd2zuy03btux6xgbf2jv2a5xx0q5rk3u2k6iyx"
                onInit={(_, editor) => {
                  editorRef.current = editor;
                }}
                initialValue={blogPost.content}
                init={{
                  height: 500,
                  menubar: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | link image media | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  images_upload_handler: async (blobInfo, progress) => {
                    try {
                      const formData = new FormData();
                      formData.append('file', blobInfo.blob(), blobInfo.filename());
                      
                      const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData
                      });
                      
                      if (!response.ok) {
                        throw new Error('Upload failed');
                      }
                      
                      const data = await response.json();
                      progress(100);
                      return data.location;
                    } catch (e) {
                      progress(0);
                      throw e;
                    }
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                name="author"
                value={blogPost.author}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={blogPost.tags}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/blog-posts')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Post'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

