//src\hooks\useChannelFollow.ts
import { useState, useEffect } from "react"

export function useChannelFollow(channelId: string) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)

  // Fetch initial state
  useEffect(() => {
    if (!channelId) return

    const fetchFollowState = async () => {
      try {
        const response = await fetch(`/api/channels/${channelId}/subscribe`)
        const data = await response.json()
        setIsFollowing(data.isSubscribed)
        setFollowerCount(data.subscriberCount)
      } catch (error) {
        console.error("Error fetching follow state:", error)
      }
    }

    fetchFollowState()
  }, [channelId])

  const toggleFollow = async () => {
    if (!channelId) return
    setIsLoading(true)

    try {
      const response = await fetch(`/api/channels/${channelId}/subscribe`, {
        method: "POST",
      })
      const data = await response.json()
      setIsFollowing(data.isSubscribed)
      setFollowerCount(data.subscriberCount)
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return { isFollowing, toggleFollow, isLoading, followerCount }
}

