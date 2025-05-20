
//src\app\api\pdf-upload\pdf-upload.tsx
'use client'

import React, { useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, ImageIcon, FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadProps } from '@/types/upload';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function PDFUpload({ channelId }: UploadProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [featureImage, setFeatureImage] = useState<File | null>(null);
  const [contentType, setContentType] = useState<string>('');
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();
   const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);


  const validateFile = (file: File, isImage = false) => {
    if (isImage) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Invalid image format. Allowed: JPEG, PNG, GIF, WEBP');
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error('Image size exceeds 2MB limit');
        return false;
      }
    } else {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error('Only PDF files are allowed');
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('PDF size exceeds 10MB limit');
        return false;
      }
    }
    return true;
  };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile);
        } else {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         const selectedImage = e.target.files?.[0];
         if (selectedImage && validateFile(selectedImage, true)) {
              setFeatureImage(selectedImage);
          } else {
             if (imageInputRef.current) imageInputRef.current.value = '';
          }
     };
  
   const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
     e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
   }, []);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
     const droppedFile = e.dataTransfer.files?.[0];
     if (droppedFile && validateFile(droppedFile)) {
       setFile(droppedFile);
    }
  }, []);

   const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
       e.preventDefault();
        const droppedImage = e.dataTransfer.files?.[0];
         if (droppedImage && validateFile(droppedImage, true)) {
            setFeatureImage(droppedImage);
          }
     }, []);


    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
    if (!file || !contentType || !title) {
       toast.error('Please fill all required fields');
         return;
      }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('contentType', contentType);
        formData.append('title', title);
        formData.append('channelId', channelId);
      if (featureImage) formData.append('featureImage', featureImage);


    try {
        setUploadStage('uploading');
          const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
           if (e.lengthComputable) {
             const progress = Math.round((e.loaded / e.total) * 90);
            setUploadProgress(progress);
           }
        });

          xhr.addEventListener('loadstart', () => {
              setUploadStage('uploading');
           });

         xhr.addEventListener('loadend', () => {
              setUploadStage('processing');
            setUploadProgress(95);
         });


     const promise = new Promise<void>((resolve, reject) => {
       xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
           if (xhr.status === 201) {
                setUploadProgress(100);
                setTimeout(() => resolve(), 500);
            } else {
                const error = JSON.parse(xhr.responseText).error;
                reject(error || 'Upload failed');
            }
          }
        };

        xhr.open('POST', '/api/upload-pdf');
       xhr.send(formData);
        });

      await toast.promise(promise, {
         pending: 'Uploading document...',
          success: 'Document uploaded successfully!',
          error: {
            render({ data }: any) {
             return `Upload failed: ${data}`;
           }
        }
       });

        setTimeout(() => router.push(`/admin/dashboard/${channelId}`), 1500);

    } catch (error) {
       console.error('Upload error:', error);
     } finally {
      setUploadStage('idle');
        setUploadProgress(0);
       }
    };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Secure Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PDF Upload Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                PDF Document <span className="text-red-500">*</span>
              </Label>
               <div
                  onDragOver={handleDragOver}
                  onDrop={handleFileDrop}
                 className={`border-2 border-dashed rounded-lg p-8 text-center ${
                     uploadStage === 'idle'
                       ? 'border-gray-300 hover:border-primary/50'
                        : 'border-primary/30 cursor-not-allowed'
                   } transition-colors`}
                >
                  <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                     <p className="text-sm text-muted-foreground">
                        Drag & drop PDF or{' '}
                         <label htmlFor="file-upload" className="text-primary cursor-pointer">
                           browse files
                      </label>
                  </p>
                   <input
                     ref={fileInputRef}
                     type="file"
                       accept=".pdf"
                        onChange={handleFileChange}
                       disabled={uploadStage !== 'idle'}
                      id="file-upload"
                       className="hidden"
                     />
                  </div>
                     {file && (
                       <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                         <FileText className="h-4 w-4" />
                        <span className="font-medium">{file.name}</span>
                       <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)}MB)</span>
                       </div>
                   )}
                 </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Document Title <span className="text-red-500">*</span>
              </Label>
              <input
                value={title}
                 onChange={(e) => setTitle(e.target.value)}
               disabled={uploadStage !== 'idle'}
                placeholder="Enter document title"
                className="border border-gray-300 bg-white rounded px-3 py-2 w-full"
              />
            </div>

            {/* Feature Image Upload */}
            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div
                 onDragOver={handleDragOver}
                onDrop={handleImageDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    uploadStage === 'idle'
                      ? 'border-gray-300 hover:border-primary/50'
                      : 'border-primary/30 cursor-not-allowed'
                } transition-colors`}
             >
                 <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Drag & drop image or{' '}
                         <label htmlFor="image-upload" className="text-primary cursor-pointer">
                        browse files
                      </label>
                 </p>
                      <input
                         ref={imageInputRef}
                        type="file"
                         accept="image/*"
                          onChange={handleImageChange}
                        disabled={uploadStage !== 'idle'}
                        id="image-upload"
                        className="hidden"
                     />
                   </div>
                {featureImage && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span className="font-medium">{featureImage.name}</span>
                    <span className="text-xs">({(featureImage.size / 1024 / 1024).toFixed(2)}MB)</span>
                    <div className="ml-2 w-24 h-12 border rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(featureImage)}
                        alt="Preview"
                       className="object-cover w-full h-full"
                     />
                   </div>
                 </div>
               )}
           </div>
          </div>

            {/* Content Type Select */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Content Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={contentType}
                onValueChange={setContentType}
                disabled={uploadStage !== 'idle'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="e-books">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-green-600" />
                      E-book
                    </span>
                  </SelectItem>
                  <SelectItem value="case-studies">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-purple-600" />
                      Case Studies
                    </span>
                  </SelectItem>
                  <SelectItem value="infographics">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-blue-600" />
                      Infographic
                    </span>
                  </SelectItem>
                  <SelectItem value="white-papers">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-purple-600" />
                      White Paper
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload Status */}
            {uploadStage !== 'idle' && (
              <div className="space-y-4">
                <Progress value={uploadProgress} className="h-2" />
                <div className="flex items-center gap-2 text-sm">
                  {uploadStage === 'uploading' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <span>
                    {uploadStage === 'uploading'
                      ? `Uploading... ${uploadProgress}%`
                      : 'Processing and securing file...'}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={uploadStage !== 'idle' || !file || !contentType || !title}
              className="w-full gap-2"
            >
              {uploadStage === 'idle' ? (
                <>
                  <Upload className="h-4 w-4" />
                  Secure Upload
                </>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadStage === 'uploading' ? 'Uploading...' : 'Processing...'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}