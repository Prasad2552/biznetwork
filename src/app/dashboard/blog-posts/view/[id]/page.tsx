'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  tags: string[];
  featuredImage?: string;
}

export default function ViewBlogPost() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (params && params.id) {
        const id = params.id as string;
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetch(`/api/blog/posts/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch blog post');
          }
          const data = await response.json();
          setBlogPost(data);
        } catch (error: any) {
          console.error('Error fetching blog post:', error);
          setError('Failed to fetch blog post. Please try again.');
          toast({
            title: "Error",
            description: "Failed to fetch blog post. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        console.error("Error: Invalid route parameters.");
        setError("Invalid blog post ID.");
        setIsLoading(false);
      }
    };

    fetchBlogPost();
  }, [params?.id, router, toast]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!blogPost) {
    return <div>Blog post not found.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>{blogPost.title}</CardTitle>
          <CardDescription>
            By {blogPost.author} on {new Date(blogPost.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blogPost.featuredImage && (
            <div className="relative w-full h-64 mb-4">
              <Image
                src={blogPost.featuredImage}
                alt={blogPost.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="rounded-md"
              />
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: blogPost.content }} className="prose max-w-none" />
          <div className="mt-4">
            <strong>Tags:</strong> {blogPost.tags.join(', ')}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard/blog-posts')}>
            Back to List
          </Button>
          <Button onClick={() => router.push(`/dashboard/blog-posts/edit/${blogPost._id}`)}>
            Edit Post
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}