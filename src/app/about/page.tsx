'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'

export default function AboutPage() {
  const [activeSidebarItem, setActiveSidebarItem] = useState('about us');
  const [isLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNavItem] = useState('All');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const sidebarItems = [
    { name: 'Publish With Us', href: '/publish' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Help', href: '/help' },
    { name: 'Send Feedback', href: '/feedback' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeSidebarItem={activeSidebarItem}
        setActiveSidebarItem={setActiveSidebarItem}
        sidebarItems={sidebarItems}
      />
      <div className="flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} activeNavItem={activeNavItem} isLoggedIn={isLoggedIn}/>

        {/* Main Content */}
        <main className="p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-semibold mt-4">
              About <span className="text-[#2A2FB8]">BizNetworQ</span>
            </h1>
            <p className="text-[#828282] text-base md:text-lg">
              Empowering Growth Through Connection
            </p>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-16">
              <div className="max-w-2xl mb-6 md:mb-0">
                <h2 className="text-xl font-semibold mb-2 mt-4 md:mt-4 text-[#2A2FB8]">Our Mission</h2>
                <p className="text-base md:text-lg text-gray-600">
                  Empowering businesses by bridging connections, sharing knowledge, and driving informed decision-making.
                </p>
              </div>
              <Image
                src="/uploads/group-300.svg"
                alt="Team collaboration illustration"
                width={250}
                height={250}
                className="w-full max-w-[250px] md:max-w-[300px] h-auto"
              />
            </div>

            <section className="mb-8 md:mb-16 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
  <Image
    src="/uploads/standup-meeting-amico.svg"
    alt="Business discussion illustration"
    width={250}
    height={250}
    className="w-full max-w-[250px] md:max-w-[300px] h-auto flex-shrink-0"
  />
  <div>
    <h2 className="text-xl md:text-2xl font-semibold text-[#2A2FB8] mb-4">Why BizNetworQ?</h2>
    <p className="text-gray-700 text-base md:text-lg">
      At BizNetworQ, we believe that the professional world thrives when we listen,
      share, and collaborate through valuable content. We&apos;re dedicated to providing
      a platform where business professionals can explore, learn, and connect
      through insights, stories, and strategies that drive growth. BizNetworQ is here to
      help you stay informed, engaged, and connected with a network that values
      innovation and impact in the ever-evolving landscape of business.
    </p>
  </div>
</section>

<section className="bg-[#EEF2FF] p-6 md:p-8 rounded-3xl text-center mb-8">
  <h2 className="text-xl md:text-2xl font-semibold mb-2">Contact Us</h2>
  <p className="text-gray-600 mb-2">We&apos;d Love to Hear From You!</p>
  <p className="text-gray-600 mb-6">
    If you have any questions, feedback, or just want to say hello, feel free to reach out. We&apos;re always happy to assist you.
  </p>
  <Button className="bg-[#2A2FB8] hover:bg-blue-700 rounded-xl">
    Get in touch
  </Button>
</section>
          </div>
        </main>
      </div>
    </div>
  );
}