'use client'

import React, { useState, useRef } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { UploadProps, CaseStudy } from '@/types/upload';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { slugify } from '@/utils/slugify';

const CaseStudyUpload: React.FC<UploadProps> = ({ channelId }) => {
    const [caseStudy, setCaseStudy] = useState<CaseStudy>({
        title: '',
        content: '',
        featuredImage: null,
        slug: '',
        channelId: '',
    });
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const router = useRouter();
    const editorRef = useRef<any>(null);

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const slug = slugify(event.target.value);
        setCaseStudy(prev => ({ ...prev, title: event.target.value, slug }));
    };

    const handleEditorChange = (content: string) => {
        setCaseStudy(prev => ({ ...prev, content }));
    };

    const handleFeaturedImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setSelectedFile(file);
        
        // Preview the image (optional)
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    setCaseStudy(prev => ({ ...prev, featuredImage: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        } else {
            setCaseStudy(prev => ({ ...prev, featuredImage: null }));
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('title', caseStudy.title);
            formData.append('content', caseStudy.content);
            formData.append('channelId', channelId);
            formData.append('slug', caseStudy.slug);

            // Append the actual File object, not the base64 string
            if (selectedFile) {
                formData.append('featuredImage', selectedFile);
            }

            const response = await fetch('/api/case-study/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.message || `HTTP error ${response.status}`);
            }

            const data = await response.json();
            toast.success('Case study uploaded successfully!');
            
            setTimeout(() => {
                router.push(`/admin/dashboard/${channelId}`);
            }, 1500);
        } catch (error) {
            console.error('Error uploading case study:', error);
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
                    <CardTitle>Create New Case Study</CardTitle>
                    <CardDescription>
                        Fill in the details below to create a new case study.
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
                                value={caseStudy.title}
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
                            {caseStudy.featuredImage && (
                                <div className="mt-2">
                                    <img 
                                        src={caseStudy.featuredImage as string} 
                                        alt="Preview" 
                                        className="max-w-xs h-auto rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

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
                            {isUploading ? 'Uploading...' : 'Publish Case Study'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    );
};

export default CaseStudyUpload;

