// src\app\api\blog\page.tsx

'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthCheck } from "@/hooks/useAuthCheck";

const sidebarItems = [
    { name: 'Publish With Us', href: '/publish' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Help', href: '/help' },
    { name: 'Send Feedback', href: '/sendfeedback' },
  ];

interface BlogPost {
  _id: string
  title: string
  excerpt: string
  content: string
  author: string
  createdAt: string
  tags: string[]
  featuredImage?: string
}

export default function BlogPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSidebarItem, setActiveSidebarItem] = useState('Blogs');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeNavItem, setActiveNavItem] = useState('All');
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter()
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
 const { isUserLoggedIn, isAdmin, handleLogout, token } = useAuthCheck();
 
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch('/api/blog/posts')
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }
        const data = await response.json()
        setBlogPosts(data.posts)
      } catch (error) {
        console.error('Error fetching blog posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogPosts()
  }, [])

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
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link href={`/blog/${post._id}`} key={post._id}>
                <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative h-48">
                      <Image
                        src={post.featuredImage || '/placeholder.svg'}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </main>
        <aside className="hidden lg:block w-80 p-6 border-l">
          <h2 className="text-xl font-semibold mb-4">Read more Blogs</h2>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-4">
              {blogPosts.slice(0, 5).map((post) => (
                <Link href={`/blog/${post._id}`} key={post._id}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="relative h-32 mb-2">
                        <Image
                          src={post.featuredImage || '/placeholder.svg'}
                          alt={post.title}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <h3 className="font-semibold mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-600">{post.excerpt}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  )
}

