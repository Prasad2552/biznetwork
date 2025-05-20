// app/subscriptions/page.tsx
"use client"

import React, { useState } from 'react';
import { SubscriptionsPage } from '@/components/subscriptions';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import Header from '@/components/header';
import { ToastContainer } from 'react-toastify';
import Sidebar from '@/components/sidebar';


const Subscriptions = () => {
    const { token, isUserLoggedIn } = useAuthCheck();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSidebarItem, setActiveSidebarItem] = useState('Subscriptions');


      const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
                  <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    activeSidebarItem={activeSidebarItem}
                    setActiveSidebarItem={setActiveSidebarItem}
                      token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
               />
                <div className="flex-1 flex flex-col min-h-screen w-full">
                    <Header toggleSidebar={toggleSidebar} />
                    <main className="flex-1 overflow-y-auto">
                       <SubscriptionsPage token={token || ""} isUserLoggedIn={!!isUserLoggedIn} />
                     </main>
                </div>
                <ToastContainer position='top-right' />
            </div>
        );
    };

    export default Subscriptions;