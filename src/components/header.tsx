// src/components/header.tsx
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, UserPlus, Menu } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { SearchInput } from '@/components/search-input';
import Pusher from 'pusher-js';

// Define the shape of the notification data
interface Notification {
    message: string;
}

interface HeaderProps {
    toggleSidebar: () => void;
    navItems?: string[];
    handleNavItemChange?: (item: string) => void;
    activeNavItem?: string;
    isLoggedIn?: boolean;
}

export default function Header({ toggleSidebar, navItems, handleNavItemChange, activeNavItem, isLoggedIn }: HeaderProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const { isAdmin } = useAuthCheck();
    const [lastActive, setLastActive] = useState<Date | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]); // Update state type
    const [unreadCount, setUnreadCount] = useState(0);

    const handleLogout = useCallback(async () => {
        try {
            await signOut();
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            localStorage.removeItem('userSession');
            setIsUserLoggedIn(false);
            toast.success('Logged out successfully!', { position: 'top-right' });
            router.push('/');
        } catch (error) {
            console.error("Error during logout:", error);
            toast.error('Logout failed. Please try again.', { position: 'top-right' });
        }
    }, [router]);

    useEffect(() => {
    console.log('Pusher Key:', process.env.NEXT_PUBLIC_PUSHER_KEY);
    console.log('Pusher Cluster:', process.env.NEXT_PUBLIC_PUSHER_CLUSTER);
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
    });
    const channel = pusher.subscribe('notifications');
    channel.bind('new-upload', (data: Notification) => {
        console.log('Received notification:', data);
        setNotifications((prev) => [...prev, data]);
        setUnreadCount((prev) => prev + 1);
    });
    return () => pusher.unsubscribe('notifications');
}, []);

    useEffect(() => {
        setIsUserLoggedIn(!!session?.user);

        const storedSession = localStorage.getItem('userSession');
        if (storedSession) {
            try {
                const sessionData = JSON.parse(storedSession);
                setLastActive(new Date(sessionData.lastActive));
            } catch (error) {
                console.error("Error parsing stored session", error);
            }
        }

        const inactivityTimer = setTimeout(() => {
            handleLogout();
        }, 24 * 60 * 60 * 1000);

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            setLastActive(new Date());
            localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: true, lastActive: new Date().toISOString() }));
            setTimeout(() => {
                handleLogout();
            }, 24 * 60 * 60 * 1000);
        };

        window.addEventListener('mousemove', resetInactivityTimer);
        window.addEventListener('keydown', resetInactivityTimer);
        window.addEventListener('click', resetInactivityTimer);

        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', resetInactivityTimer);
            window.removeEventListener('keydown', resetInactivityTimer);
            window.removeEventListener('click', resetInactivityTimer);
        };
    }, [session, handleLogout]);

    // Initialize Pusher and subscribe to notifications
    useEffect(() => {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
        });
        const channel = pusher.subscribe('notifications');
        channel.bind('new-upload', (data: Notification) => {
            setNotifications((prev) => [...prev, data]);
            setUnreadCount((prev) => prev + 1);
        });

        return () => {
            pusher.unsubscribe('notifications');
        };
    }, []);

    const handleDashboardRedirect = () => {
        if (isAdmin) {
            router.push('/admin/channels');
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <header className="sticky top-0 z-10 bg-[#F9F9F9]">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </Button>
                </div>

                <div className="flex-1 items-center md:max-w-xl mx-1 md:mx-4 md:flex">
                    <SearchInput />
                </div>

                <div className="flex items-center space-x-0 md:space-x-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative md:inline-flex">
                                <Bell size={24} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {notifications.length > 0 ? (
                                notifications.map((notification, index) => (
                                    <DropdownMenuItem key={index}>
                                        {notification.message}
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem>No new notifications</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {!isUserLoggedIn && (
                        <Link href="/signin">
                            <Button variant="default" className="bg-blue-800 text-white items-center h-8 px-2 gap-0 md:text-md text-xs md:gap-0 md:h-8 md:px-2 md:flex">
                                <UserPlus className="w-4 h-4 mr-1 md:mr-2" />
                                Subscribe
                            </Button>
                        </Link>
                    )}

                    {isUserLoggedIn ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="cursor-pointer">
                                    {session?.user?.image ? (
                                        <AvatarImage src={session.user.image} alt="User" />
                                    ) : (
                                        <AvatarImage src="/placeholder-user.jpg" alt="User" />
                                    )}
                                    <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleDashboardRedirect}>
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/profile')}>
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings')}>
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleLogout}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/signin">
                        </Link>
                    )}
                </div>
            </div>

            {navItems && (
                <div className="w-full overflow-x-auto scrollbar-hide">
                    <nav className="flex items-center space-x-2 p-2 snap-x snap-mandatory">
                        {navItems.map((item) => (
                            <Button
                                key={item}
                                variant="ghost"
                                className={`
                                    ${activeNavItem === item
                                        ? "bg-[#2A2FB8] text-white hover:bg-blue-800 hover:text-white"
                                        : "bg-gray-200 text-black hover:bg-gray-300"
                                    }
                                    ml-2 text-[0.6rem] font-semibold px-3 py-1 h-7 rounded-md whitespace-nowrap snap-start flex-shrink-0
                                `}
                                onClick={() => handleNavItemChange && handleNavItemChange(item)}
                            >
                                {item}
                            </Button>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
