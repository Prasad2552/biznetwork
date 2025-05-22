'use client'

import React, { useState } from 'react'
import Header from '@/components/header'
import Sidebar from '@/components/sidebar'
import Image from 'next/image'
  import { useAuthCheck } from '@/hooks/useAuthCheck';
const sidebarItems = [
  { name: 'Publish With Us', href: '/publish' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Help', href: '/help' },
  { name: 'Send Feedback', href: '/sendfeedback' },

]

export default function HowItWorksPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('How BizNetworQ Works')
  const { token, isUserLoggedIn, isAdmin, handleLogout } = useAuthCheck();
  const [activeNavItem] = useState('All')
  const [isLoggedIn] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

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
          <h1 className="text-3xl font-bold mb-4 mt-4">How BizNetworQ works</h1>

          {/* Subscription & Account Access Section */}
          <section className="mb-12 flex items-center justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-[#2A2FB8] mb-4">Subscription & Account access</h2>
              <p className="text-gray-700 mb-4">
                <span className="text-[#2A2FB8]"> Non-Subscribers:</span> Users who visit BizNetworQ without signing up can browse and read and view business content but won&apos;t have access to interactive features such as liking, sharing, commenting, and saving content.
              </p>
              <p className="text-gray-700">
                <span className="text-[#2A2FB8]">Subscriber:</span> Once a user subscribes or signs up, they unlock additional features, including the ability to customize content preferences, engage with content through likes, shares, and comments, and save content for future reference.
              </p>
            </div>
            <Image
              src="/uploads/Subscriptions-amico.svg"
              alt="Subscription Access Illustration"
              width={250}
              height={250}
              className="ml-6"
            />
          </section>

          {/* Following Companies Section */}
          <section className="mb-12 flex items-center justify-between">
            <Image
              src="/uploads/Followers-rafiki.svg"
              alt="Following Companies Illustration"
              width={250}
              height={250}
              className="mr-6"
            />
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-[#2A2FB8] mb-4">Following Companies and Receiving Updates</h2>
              <p className="text-gray-700">
                Subscribers can follow specific companies, enabling them to receive notifications directly on the platform about new updates. This feature ensures they stay updated on relevant business news, new content in their preferred segments, and any important updates from followed companies.
              </p>
            </div>
          </section>

          {/* Content Recommendations Section */}
          <section className="mb-12 flex items-center justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-[#2A2FB8] mb-4">Content Recommendations and Personalization</h2>
              <p className="text-gray-700">
                BizNetworQ tracks user engagement, usage patterns, and preferences to offer tailored recommendations. The platform&apos;s algorithm suggests business content based on each user&apos;s engagement history and shows segments making it easy to discover content that matches their interests.
              </p>
            </div>
            <Image
              src="/uploads/Content-team-rafiki.svg"
              alt="Content Recommendations Illustration"
              width={250}
              height={250}
              className="ml-6"
            />
          </section>

          {/* Content Engagement Section */}
          <section className="mb-12 flex items-center justify-between">
            <Image
              src="/uploads/Mention-amico.svg"
              alt="Content Engagement Illustration"
              width={250}
              height={250}
              className="mr-6"
            />
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-[#2A2FB8] mb-4">Content Engagement and Community Interaction</h2>
              <p className="text-gray-700">
                With subscription, users can engage more deeply by liking, sharing, and commenting on content. These features foster a professional community, allowing users to connect over shared business interests and insights.
              </p>
            </div>
          </section>

          {/* Content Analytics Section */}
          <section className="mb-12 flex items-center justify-between">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-[#2A2FB8] mb-4">Content Analytics for Publishers</h2>
              <p className="text-gray-700">
                While regular users don&apos;t access analytics, business publishers gain insights into their content&apos;s performance. Publishers can view engagement metrics and analytics on their published posts, helping them understand audience interest and interaction.
              </p>
            </div>
            <Image
              src="/uploads/Business-analytics-rafiki 1.svg"
              alt="Content Analytics Illustration"
              width={250}
              height={250}
              className="ml-6"
            />
          </section>

          {/* Basic User Features Section */}
          <section className="mb-12 flex items-center justify-between">
            <Image
              src="/uploads/Features-Overview-cuate.svg"
              alt="Basic Features Illustration"
              width={250}
              height={250}
              className="mr-6"
            />
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-[#2A2FB8] mb-4">Basic User Features</h2>
              <p className="text-gray-700">
                BizNetworQ provides users with essential tools to manage their experience, including saving content, accessing their viewing history, adjusting content preferences, and signing in or out as needed.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}