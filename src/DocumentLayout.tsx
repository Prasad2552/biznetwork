// DocumentLayout.tsx
'use client'
import React from 'react';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';


const sidebarItems = [
    { name: 'Publish With Us', href: '/publish' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Help', href: '/help' },
    { name: 'Send Feedback', href: '/sendfeedback' },
];

interface DocumentLayoutProps {
    children: React.ReactNode;
}
export default function DocumentLayout({ children }: DocumentLayoutProps) {

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [activeSidebarItem, setActiveSidebarItem] = React.useState('');
    const [activeNavItem] = React.useState('All');
    const [isLoggedIn] = React.useState(false);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                activeSidebarItem={activeSidebarItem}
                setActiveSidebarItem={setActiveSidebarItem}
                sidebarItems={sidebarItems}
            />
            <div className="flex-1 flex flex-col">
                <Header
                    toggleSidebar={toggleSidebar}
                    activeNavItem={activeNavItem}
                    isLoggedIn={isLoggedIn}
                />
                <main className="container mx-auto px-4 py-8 flex-1">
                 {children}
                </main>
            </div>
        </div>
    );
}