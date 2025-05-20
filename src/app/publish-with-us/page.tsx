'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { PublishForm } from '@/components/publish-form'

export default function PublishPage() {
    const [activeSidebarItem, setActiveSidebarItem] = useState('about us');
    const [isLoggedIn] = useState(false); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Here's the state!
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
        <div className="flex-1">
          <Header  toggleSidebar={toggleSidebar} activeNavItem={activeNavItem} isLoggedIn={isLoggedIn}/>
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <PublishForm />
        </main>
      </div>
    </div>
  )
}

