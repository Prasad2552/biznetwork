'use client'

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Upload } from 'lucide-react';
import { useAuthCheck } from "@/hooks/useAuthCheck";

const sidebarItems = [
  { name: 'Publish With Us', href: '/publish' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Help', href: '/help' },
  { name: 'Send Feedback', href: '/sendfeedback' },
];

export default function SendFeedbackPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Send Feedback');
  const [activeNavItem] = useState('All');
  const [isLoggedIn] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { isUserLoggedIn, isAdmin, handleLogout, token } = useAuthCheck();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
    }
  });

  const onSubmit = (data: any) => {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('feedback', data.feedback);
    files.forEach(file => {
      formData.append('files', file);
    });
    console.log("Feedback data submitted:", data, files);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
                                                         isSidebarOpen={isSidebarOpen}
                                                         toggleSidebar={toggleSidebar}
                                                         activeSidebarItem={activeSidebarItem}
                                                         setActiveSidebarItem={setActiveSidebarItem}
                                                         token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
                                                     />
      <div className="flex-1">
        <Header 
          toggleSidebar={toggleSidebar} 
          activeNavItem={activeNavItem} 
          isLoggedIn={isLoggedIn}
        />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Send Feedback to BizNetworQ</h1>
          <div className="border border-[#E1E1E1] rounded-lg p-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Describe Your Feedback</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Input 
                      type="text" 
                      placeholder="Subject" 
                      {...register('subject', { required: true })} 
                      className="bg-[#F5F5F5]"
                    />
                    {errors.subject && (
                      <span className="text-red-500 text-sm">Subject is required</span>
                    )}
                  </div>
                  
                  <div>
                    <Textarea 
                      placeholder="Enter your feedback here..." 
                      {...register('feedback', { required: true })} 
                      className="min-h-[150px] bg-[#F5F5F5]"
                    />
                    {errors.feedback && (
                      <span className="text-red-500 text-sm">Feedback is required</span>
                    )}
                  </div>

                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors
                      ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Upload className="h-6 w-6" />
                      <p className="text-sm text-center">
                        {isDragActive ? 
                          "Drop the files here..." : 
                          "Click to browse or drag and drop your files"
                        }
                      </p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-[#2A2FB8] hover:bg-[#2426A8]"
                  >
                    Submit
                  </Button>
                </form>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <Image 
                  src="/uploads/Feedback-rafiki.svg"
                  alt="Feedback Illustration"
                  width={400}
                  height={400}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

    