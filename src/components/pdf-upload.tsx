// src/app/api/pdf-upload/pdf-upload.tsx
'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadProps } from '@/types/upload';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PDFUpload({ channelId }: UploadProps) {
  const [uploadError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [featureImage, setFeatureImage] = useState<File | null>(null);
  const [contentType, setContentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFeatureImage(e.target.files[0]);
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

     if (!file || !contentType || !title) {
      toast.error('Please select a PDF file, content type, and enter a title.');
       return;
     }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', contentType);
    formData.append('title', title);
    formData.append('channelId', channelId);

    if (featureImage) {
      formData.append('featureImage', featureImage);
    }

    try {
        const response = await fetch('/api/upload-pdf', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
             const errorData = await response.json();
               toast.error(errorData?.message || `HTTP error ${response.status}`);
             throw new Error(errorData?.message || `HTTP error ${response.status}`);
         }
          const data = await response.json();
            await toast.promise(
                  Promise.resolve(data),
                  {
                      pending: 'Uploading PDF...',
                      success: `PDF uploaded successfully! PDF Name: ${data.title}`,
                       error: `Failed to upload PDF.`
                  }
              );
          setTimeout(() => {
              router.push(`/admin/dashboard/${channelId}`);
         }, 1500);

    } catch (error) {
       console.error('Error uploading PDF:', error);
          toast.error("An unknown error occurred.");


    } finally {
       setIsUploading(false);
     }
  };

  return (
    <>
     <ToastContainer />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="pdf-upload">Upload PDF</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            required
          />
        </div>

        <div>
          <Label htmlFor="feature-image">Feature Image (Optional)</Label>
          <Input
            id="feature-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploading}
          />
        </div>

        <div>
          <Label htmlFor="content-type">Content Type</Label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger id="content-type">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="e-books">E-book</SelectItem>
              <SelectItem value="infographics">Infographic</SelectItem>
              <SelectItem value="white-papers">White Paper</SelectItem>
              {/* Add other content types as needed */}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isUploading || !file || !contentType || !title}>
          {isUploading ? 'Uploading...' : 'Upload PDF'}
          <Upload className="ml-2 h-4 w-4" />
        </Button>

          {/* Alert messages */}
        {uploadError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
      </form>
     </>
  );
}