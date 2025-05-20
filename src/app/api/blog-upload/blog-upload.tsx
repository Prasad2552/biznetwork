// src/app/api/blog-upload/blog-upload.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { UploadProps, BlogPost } from '@/types/upload';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface ModifiedBlogPost extends BlogPost {
    orientation: 'horizontal' | 'vertical' | null;
}

interface BlogPostUploadProps extends UploadProps {
  channelId: string;
  isTechNews?: boolean; // Add this prop
}

export default function BlogPostUpload({ channelId, isTechNews }: BlogPostUploadProps) {
    const [blogPost, setBlogPost] = useState<ModifiedBlogPost>({
        title: '',
        content: '',
        featuredImage: null,
        orientation: null // Initial value
    });
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const editorRef = useRef<any>(null);

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setBlogPost(prev => ({ ...prev, title: event.target.value }));
    };

    const handleEditorChange = (content: string) => {
        setBlogPost(prev => ({ ...prev, content }));
    };

    const handleFeaturedImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setBlogPost(prev => ({ ...prev, featuredImage: file }));
    };

    const handleOrientationChange = (orientation: 'horizontal' | 'vertical' | null) => {
        setBlogPost(prev => ({ ...prev, orientation }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsUploading(true);

        const formData = new FormData();
        formData.append('title', blogPost.title);
        formData.append('content', blogPost.content);
        formData.append('channelId', channelId);
        formData.append('orientation', blogPost.orientation || ''); // Send orientation to the API

        if (blogPost.featuredImage) {
            formData.append('featuredImage', blogPost.featuredImage);
        }

        try {
          const apiEndpoint = isTechNews ? '/api/tech-news-upload' : '/api/blog/upload'; // Corrected endpoint
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.message || `HTTP error ${response.status}`);
            }

            const data = await response.json();
            toast.success(`${isTechNews ? 'Tech News' : 'Blog post'} uploaded successfully!`);
            setTimeout(() => {
                router.push(`/admin/dashboard/${channelId}`);
            }, 1500);
        } catch (error) {
            console.error('Error uploading blog post:', error);
            toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <ToastContainer />
            <Card>
                <CardHeader>
                    <CardTitle>Create New {isTechNews ? 'Tech News' : 'Blog Post'}</CardTitle> {/* Title based on context */}
                    <CardDescription>
                        Fill in the details below to create a new {isTechNews ? 'Tech News' : 'blog post'}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="Enter title"
                                value={blogPost.title}
                                onChange={handleTitleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="featuredImage">Featured Image</Label>
                            <Input
                                id="featuredImage"
                                type="file"
                                accept="image/*"
                                onChange={handleFeaturedImageChange}
                            />
                        </div>

                        {/* Add the Orientation Select */}
                        <div className="space-y-2">
                            <Label htmlFor="orientation">Orientation (Optional)</Label>
                            <Select onValueChange={(value) => handleOrientationChange(value as 'horizontal' | 'vertical' | null)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select orientation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="horizontal">Horizontal</SelectItem>
                                    <SelectItem value="vertical">Vertical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* End Orientation Select */}

                        <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <TinyMCEEditor
                                apiKey='oxpar47sm2yd2zuy03btux6xgbf2jv2a5xx0q5rk3u2k6iyx'
                                onInit={(evt, editor) => editorRef.current = editor}
                                initialValue=""
                                init={{
                                    height: 500,
                                    menubar: false,
                                    plugins: [
                                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                        'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                                    ],
                                    toolbar: 'undo redo | blocks | ' +
                                        'bold italic forecolor | alignleft aligncenter ' +
                                        'alignright alignjustify | bullist numlist outdent indent | ' +
                                        'removeformat | help',
                                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                }}
                                onEditorChange={handleEditorChange}
                            />
                        </div>

                        <Button type="submit" disabled={isUploading}>
                            {isUploading ? 'Uploading...' : `Publish ${isTechNews ? 'Tech News' : 'Blog Post'}`}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}