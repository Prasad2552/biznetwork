// src/components/subscriptions.tsx
"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useChannelFollow } from "@/hooks/useChannelFollow"; // Import useChannelFollow
import { useAuthContext } from "@/contexts/auth-context";


interface ChannelSubscription {
    channelId: string
    channelLogo: string
    channelName: string
    description: string
    subscriberCount: number
    author?: string
    views?: number
     videoCount?: number;
}

interface SubscriptionsPageProps {
    token: string
     isUserLoggedIn: boolean
}

export const SubscriptionsPage = ({ token, isUserLoggedIn }: SubscriptionsPageProps) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [subscriptions, setSubscriptions] = useState<ChannelSubscription[] | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [userLoggedIn, setUserLoggedIn] = useState(false);

   useEffect(() => {
           setUserLoggedIn(!!session?.user);
      const storedSession = localStorage.getItem('userSession');
      if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          const lastActive = new Date(sessionData.lastActive);
          const now = new Date();
          const diff = now.getTime() - lastActive.getTime();
          const oneDay = 24 * 60 * 60 * 1000;

          if (diff > oneDay) {
              handleLogout();
          }
      }

    }, [session]);

   const handleLogout = async () => {
          try {
              await signOut();
              localStorage.removeItem('token');
              sessionStorage.removeItem('token');
               localStorage.removeItem('userSession');
               setUserLoggedIn(false)
              toast.success('Logged out successfully!', { position: 'top-right' });
              router.push('/');
          } catch (error) {
              console.error("Error during logout:", error);
              toast.error('Logout failed. Please try again.', { position: 'top-right' });
          }
      };

    // Move fetchSubscriptions outside useEffect to avoid recreation on every render
  const fetchSubscriptions = useCallback(async () => {
        if (!isUserLoggedIn || !session?.user?.id) {
             setSubscriptions([]);
            setIsLoading(false);
            return
        }
        try {
            const response = await fetch(`/api/users/${session.user.id}/subscriptions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to fetch subscriptions")
            }
            const data = await response.json()
            setSubscriptions(data)
            setIsLoading(false)
        } catch (error) {
            console.error("Error fetching subscriptions:", error)
            toast.error(`Failed to fetch subscriptions. ${error instanceof Error ? error.message : "Unknown error"}.`)
            setIsLoading(false)
             setSubscriptions([]);
        }
    }, [token, isUserLoggedIn, session?.user?.id])


    useEffect(() => {
        fetchSubscriptions()
    }, [fetchSubscriptions])

    const handleSubscriberCountChange = useCallback((count: number, index: number, channelId: string) => {
          setSubscriptions((prevSubscriptions) => {
            if (prevSubscriptions) {
                  const updatedSubscriptions = [...prevSubscriptions];
                if (updatedSubscriptions[index] && updatedSubscriptions[index].channelId === channelId) {
                      updatedSubscriptions[index] = { ...updatedSubscriptions[index], subscriberCount: count };
                     }
                      return updatedSubscriptions;
             }
             return prevSubscriptions;
         });
      }, []);

    if (isLoading) {
        return <div>Loading Subscriptions...</div>
    }

    if (!userLoggedIn || !session?.user) {
        return (
            <div className="text-center mt-8">
                <p>
                    Please{" "}
                    <Link href="/signin" className="text-blue-600">
                        sign in
                    </Link>{" "}
                    to view your subscriptions.
                </p>
            </div>
        )
    }

    if (subscriptions === null) {
        return <div>Loading Subscriptions...</div>;
    }

    if (subscriptions.length === 0) {
        return (
            <div className="text-center mt-8">
                <p>You are not subscribed to any channel yet</p>
            </div>
        );
    }

    return (
             <div className="flex-1 overflow-y-auto p-4">
                <div className="container mx-auto p-4">
                    <h1 className="text-2xl font-bold mb-8">Subscriptions</h1>
                    {subscriptions.map((sub, index) => (
                        <SubscriptionItem
                           key={sub.channelId}
                           sub={sub}
                           index={index}
                           handleSubscriberCountChange={handleSubscriberCountChange}
                         token={token || ""}
                            />
                    ))}
                  </div>
        </div>
    )
}

const SubscriptionItem = ({ sub, index, handleSubscriberCountChange, token }: { sub: ChannelSubscription; index: number; handleSubscriberCountChange: (count: number, index: number, channelId: string) => void; token: string }) => {
  const { data: session } = useSession();
    const { isFollowing, toggleFollow, isLoading, followerCount } = useChannelFollow(sub.channelId || "");
    const { openSignInModal } = useAuthContext()
    const router = useRouter()

    useEffect(() => {
       if (followerCount) {
          handleSubscriberCountChange(followerCount, index, sub.channelId);
       }
    }, [followerCount, handleSubscriberCountChange, index, sub.channelId]);


    const handleFollowClick = async () => {
      if (!session?.user) {
        openSignInModal();
        return;
      }
      await toggleFollow()
    }

        return (
             <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                         <Avatar className="w-10 h-10">
                             <AvatarImage src={sub.channelLogo || "/placeholder.svg"} alt={`${sub.channelName} Logo`} />
                              <AvatarFallback>{sub.channelName?.charAt(0) || "U"}</AvatarFallback>
                           </Avatar>
                            <div>
                                 <h2 className="text-base font-semibold">{sub.channelName}</h2>
                                  <div className="text-sm text-gray-600 flex items-center">
                                   <span className="mr-2">{sub.subscriberCount} followers</span>
                                   <span>{sub.videoCount} videos</span>
                                </div>
                              <p className="text-sm text-gray-800 line-clamp-2">{sub.description}</p>
                            </div>
                      </div>
                      <Button
                          variant="default"
                          onClick={handleFollowClick}
                            className="text-sm font-medium bg-[#2A2FB8] text-white rounded-full px-8"
                         disabled={isLoading}
                      >
                      {isLoading ? "Loading..." : session?.user ? (isFollowing ? "Unfollow" : `Subscribe (${sub.subscriberCount})`) : `Subscribe (${sub.subscriberCount})`}
                       </Button>
                  </div>
        )
 }