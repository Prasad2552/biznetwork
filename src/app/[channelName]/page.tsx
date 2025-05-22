// src/app/[channelName]/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ToastContainer } from "react-toastify"
import { Menu, Search, Mic, UserPlus, Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/sidebar"
import { useAuthCheck } from "@/hooks/useAuthCheck"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getChannel } from "@/app/actions/getChannel"
import { ContentGrid } from "@/components/content-grid"
import type { Channel } from "@/types/channel"
import type { Content } from "@/types/common"
import { getChannelContent } from "@/app/actions/getChannelContent"
import SubscribeButton from "@/components/subscribe-button" // Import SubscribeButton

const ChannelPage: React.FC = () => {
    const params = useParams<{ channelName?: string }>();
    const encodedChannelName = params?.channelName;
    const decodedChannelName = decodeURIComponent(encodedChannelName || "");

    const [channel, setChannel] = useState<Channel | null>(null)
    const [contents, setContents] = useState<Content[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const { token, isUserLoggedIn, isAdmin, handleLogout } = useAuthCheck()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [activeSidebarItem, setActiveSidebarItem] = useState(``)
    const router = useRouter()
    const { data: session, status } = useSession()
    const searchParams = useSearchParams();

    const activeNavItem = searchParams?.get("activeNavItem") || "All";

    useEffect(() => {
        console.log("decodedChannelName:", decodedChannelName);
        const fetchChannelData = async () => {
            if (!decodedChannelName) return;

            setIsLoading(true);
            setError(null);

            try {
                const channelData = await getChannel(decodedChannelName);

                if (!channelData) {
                    setError("Channel not found.");
                    return;
                }

                setChannel(channelData);

                try {
                    const content = await getChannelContent(channelData._id, activeNavItem);
                    setContents(content);
                } catch (contentErr) {
                    console.error("Error fetching content:", contentErr);
                    setError("Error loading channel content.");
                }

            } catch (channelErr) {
                console.error("Error loading channel:", channelErr);
                setError("Error loading channel information.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchChannelData();
    }, [decodedChannelName, activeNavItem]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const handleDashboardRedirect = () => {
        if (isAdmin) {
            router.push("/admin/channels")
        } else {
            router.push("/dashboard")
        }
    }

    const handleContentClick = (item: Content) => {
        if (!item?.type) {
            console.error("Content type not found:", item)
            return
        }
        switch (item.type.toLowerCase()) {
            case "video":
                router.push(`/watch/${item.slug}`)
                break
            case "blogpost":
                router.push(`/blog/posts/${item.slug}`)
                break
            case "podcast":
                router.push(`/podcast/${item.slug}`)
                break
            default:
                router.push(`/${item.type}/${item.slug}`)
        }
    }

    const navItems = [
        "All",
        "Videos",
        "Blogs",
        "Webinars",
        "Podcasts",
        "Case Studies",
        "Info-graphics",
        "White-papers",
        "Testimonials",
        "E-books",
        "Demos",
        "Events",
    ]

    const handleNavItemChange = (navItem: string) => {
        const newUrl = navItem === "All"
            ? `/${decodedChannelName}`
            : `/${decodedChannelName}?activeNavItem=${navItem}`;

        router.push(newUrl, { scroll: false });
    }

    const renderHeader = () => (
        <header className="sticky top-0 z-10 bg-white shadow-sm">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </Button>
                    <div className="text-xl font-bold ml-2 md:hidden">BizNetwork</div>
                </div>

                <div className="hidden md:flex flex-1 items-center max-w-xl mx-4">
                    <div className="relative flex-grow">
                        <Input type="text" placeholder="Search" className="w-full rounded-lg pl-10 pr-4" />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Mic className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                        <Bell size={24} />
                    </Button>

                    {isUserLoggedIn ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="cursor-pointer">
                                    {session?.user?.image ? (
                                        <AvatarImage src={session.user.image} alt="User" />
                                    ) : (
                                        <AvatarImage src="/placeholder-user.jpg" alt="User" />
                                    )}
                                    <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleDashboardRedirect}>
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push("/profile")}>
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push("/settings")}>
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onSelect={handleLogout}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link href="/signin">
                            <Button variant="ghost" className="bg-[#2A2FB8] text-white hidden md:flex items-center h-8 px-2 gap-0">
                                <UserPlus className="w-4 h-4 mr-2" /> Subscribe
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="w-full overflow-x-auto scrollbar-hide">
                <nav className="flex items-center space-x-2 p-2 snap-x snap-mandatory">
                    {navItems.map((item) => (
                        <Button
                            key={item}
                            variant="ghost"
                            className={`
                                font-normal
                                ${
                                  activeNavItem === item
                                    ? "bg-[#2A2FB8] text-white hover:bg-blue-800 hover:text-white"
                                    : "bg-gray-100 text-black hover:bg-gray-300"
                                }
                                ml-2 text-[0.6rem] px-3 py-1 h-7 rounded-md whitespace-nowrap snap-start flex-shrink-0
                            `}
                            onClick={() => handleNavItemChange(item)}
                        >
                            {item}
                        </Button>
                    ))}
                </nav>
            </div>
        </header>
    )

     const renderContent = () => {
        switch (activeNavItem) {
            case "All":
            case "Videos":
            case "Blogs":
            case "Webinars":
            case "Podcasts":
            case "Case Studies":
            case "Info-graphics":
            case "White-papers":
            case "Testimonials":
            case "E-books":
            case "Demos":
            case "Events":
                return (
                    <div className="mt-8">
                         {(() => {
        console.log("Contents:", contents);
        return null; // Or return any other valid ReactNode if needed
    })()}
                        {!isLoading ? (
                            <ContentGrid contents={contents} type={activeNavItem} channel={channel} />
                        ) : (
                            <div className="min-h-screen flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                    </div>
                );
            default:
                return <div>Invalid navigation item selected.</div>;
        }
    };


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !channel) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">{error || "Channel Not Found"}</h1>
                    <p className="mt-2 text-gray-600">The channel you're looking for doesn't exist.</p>
                    <Button className="mt-4" onClick={() => router.push("/")}>
                        Go Home
                    </Button>
                </div>
            </div>
        )
    }

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
                {renderHeader()}
                <main className="flex-1 overflow-y-auto p-4">
                    <ToastContainer position="top-right" />
                    <div className="container mx-auto py-6">
                        {/* Channel Banner */}
                        <div className="relative h-64 rounded-lg overflow-hidden">
                            <Image
                                src={channel.banner || "/placeholder.svg"}
                                alt="Channel Banner"
                                fill
                                className="object-cover w-full h-full"
                                style={{ objectFit: "cover" }}
                            />
                        </div>

                        {/* Channel Info */}
                        <div className="flex items-center mt-2">
                            <Image
                                src={channel.logo || "/placeholder.svg"}
                                alt="Channel Avatar"
                                width={80}
                                height={80}
                                className="rounded-full mr-4"
                            />
                            <div>
                                <h1 className="text-2xl font-bold">{channel.name}</h1>
                                <p className="text-gray-600">{channel.description}</p>
                                <p className="text-gray-600">
                                    {channel.subscribers.toLocaleString()} Subscribers • {channel.engagements.toLocaleString()}{" "}
                                    Engagements
                                </p>
                            </div>
                        </div>

                        {/* Subscribe Button */}
                            <SubscribeButton
                                channelId={channel?._id || ''}
                                className="mt-4 bg-[#2A2FB8] rounded-lg text-white hover:bg-blue-800"
                                onSubscriberCountChange={() => {}}
                            />
                        {/* Content */}
                          {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default ChannelPage