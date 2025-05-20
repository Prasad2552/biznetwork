"use client"

import { useEffect, useState, useCallback, useRef, startTransition, use } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useChannelFollow } from "@/hooks/useChannelFollow"

// Dynamically import heavy components
const Sidebar = dynamic(() => import("@/components/sidebar"), { ssr: false })
const Header = dynamic(() => import("@/components/header"), { ssr: false })
const ShareModal = dynamic(() => import("@/components/ShareModal"), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />,
})

interface BlogPost {
  _id: string
  title: string
  content: string
  author: string
  createdAt: string
  featuredImage?: string
  channelId?: string
  views?: number
  likes?: number
  dislikes?: number
  slug?: string
  channelLogo?: string
  type?: "blogpost" | "technews"
}

interface SidebarBlogPost {
  _id: string
  title: string
  author: string
  views: number
  featuredImage?: string
  slug?: string
  channelLogo?: string
}

// Function to calculate estimated reading time
const calculateReadingTime = (content: string): number => {
  const text = content.replace(/<[^>]*>/g, "") // Remove HTML tags
  const words = text.split(/\s+/).filter(Boolean) // Split into words and remove empty strings
  const wordCount = words.length
  const wordsPerMinute = 200 // Adjust this value as needed
  const readingTime = Math.ceil(wordCount / wordsPerMinute)
  return readingTime
}

export default function BlogPost({ params }: { params: Promise<{ id: string }> }) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<SidebarBlogPost[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>("Home") // Added state for activeSidebarItem
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { data: session } = useSession()
  const userId = session?.user?.id || null
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)
  const [hasDisliked, setHasDisliked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const actionInProgress = useRef(false)
  const { isFollowing, toggleFollow, isLoading, followerCount } = useChannelFollow(post?.channelId || "")

  // New state variable for reading time
  const [readingTime, setReadingTime] = useState<number | null>(null)

  // Unwrap the params Promise using React.use()
  const { id } = use(params)

  // Memoized fetch functions
  const fetchPost = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/blog/posts/${id}`)
      if (!response.ok) throw new Error("Failed to fetch blog post")
      return (await response.json()) as BlogPost
    } catch (error) {
      setError("Error loading blog post")
      console.error(error)
      return null
    }
  }, [])

  const fetchRelatedPosts = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/blog/related-posts/${id}`)
      if (!response.ok) return []
      const data = await response.json()
      return data.posts.slice(0, 5)
    } catch (error) {
      console.error(error)
      return []
    }
  }, [])

  const fetchUserInteractions = useCallback(async (postId: string, userId: string) => {
    try {
      const response = await fetch(`/api/users/interactions?postId=${postId}&userId=${userId}`)
      if (!response.ok) return { hasLiked: false, hasDisliked: false, isSaved: false }
      return await response.json()
    } catch (error) {
      console.error("Error fetching user interaction:", error)
      return { hasLiked: false, hasDisliked: false, isSaved: false }
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const postData = await fetchPost(id)
        if (!postData) return

        startTransition(() => {
          setPost(postData)
          setIsLoggedIn(!!session?.user)
        })

        // Parallel fetching of related posts and user interactions
        const [relatedData, interactions] = await Promise.all([
          fetchRelatedPosts(id),
          userId ? fetchUserInteractions(postData._id, userId) : Promise.resolve(null),
        ])

        startTransition(() => {
          setRelatedPosts(relatedData)
          if (interactions) {
            setHasLiked(interactions.hasLiked)
            setHasDisliked(interactions.hasDisliked)
            setIsSaved(interactions.isSaved)
          }
        })
      } catch (error) {
        setError("Failed to load data")
        console.error(error)
      }
    }

    loadData()
  }, [id, session, userId, fetchPost, fetchRelatedPosts, fetchUserInteractions])

  // Calculate reading time whenever the post content changes
  useEffect(() => {
    if (post?.content) {
      setReadingTime(calculateReadingTime(post.content))
    }
  }, [post?.content])

  const performAction = useCallback(
    async (action: () => Promise<void>, successMessage: string, errorMessage: string) => {
      if (actionInProgress.current) {
        toast.warn("Please wait, action in progress...", { position: "top-right" })
        return
      }

      actionInProgress.current = true
      try {
        await action()
        toast.success(successMessage, { position: "top-right" })
      } catch (error) {
        console.error("Action failed:", error)
        toast.error(errorMessage, { position: "top-right" })
      } finally {
        actionInProgress.current = false
      }
    },
    [],
  )

  // Memoized interaction handlers
  const handleLike = useCallback(async () => {
    if (!userId || !post?._id) {
      toast.warn("Please log in to like this post.", { position: "top-right" })
      return
    }

    await performAction(
      async () => {
        const response = await fetch("/api/users/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post._id, userId }),
        })
        if (!response.ok) throw new Error("Failed to like the post")

        setHasLiked((prev) => !prev)
        setHasDisliked(false)
        setPost((prev) =>
          prev
            ? {
                ...prev,
                likes: hasLiked ? (prev.likes || 1) - 1 : (prev.likes || 0) + 1,
                dislikes: hasDisliked ? (prev.dislikes || 1) - 1 : prev.dislikes,
              }
            : prev,
        )
      },
      hasLiked ? "Like removed!" : "Post liked!",
      "Failed to update like. Please try again.",
    )
  }, [userId, post?._id, hasLiked, hasDisliked, performAction])

  const handleDislike = useCallback(async () => {
    if (!userId || !post?._id) {
      toast.warn("Please log in to dislike this post.", { position: "top-right" })
      return
    }

    await performAction(
      async () => {
        const response = await fetch("/api/users/dislike", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post._id, userId }),
        })
        if (!response.ok) throw new Error("Failed to dislike the post")

        setHasDisliked((prev) => !prev)
        setHasLiked(false)
        setPost((prev) =>
          prev
            ? {
                ...prev,
                dislikes: hasDisliked ? (prev.dislikes || 1) - 1 : (prev.dislikes || 0) + 1,
                likes: hasLiked ? (prev.likes || 1) - 1 : prev.likes,
              }
            : prev,
        )
      },
      hasDisliked ? "Dislike removed!" : "Post disliked!",
      "Failed to update dislike. Please try again.",
    )
  }, [userId, post?._id, hasDisliked, hasLiked, performAction])

  const handleSave = useCallback(async () => {
    if (!userId || !post?._id) {
      toast.warn("Please log in to save this post.", { position: "top-right" })
      return
    }

    await performAction(
      async () => {
        const payload = {
          userId,
          ...(post?.type === "technews" ? { techNewsId: post._id } : { postId: post._id }),
        }
        const response = await fetch("/api/users/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error("Failed to save the post")

        setIsSaved((prev) => !prev)
      },
      isSaved ? "Post unsaved!" : "Post saved!",
      "Failed to save the post. Please try again.",
    )
  }, [userId, post?._id, isSaved, performAction, post?.type])

  const handleShare = useCallback(async () => {
    if (!post?.slug) return

    const postUrl = `${window.location.origin}/blog/posts/${post.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url: postUrl })
        toast.success("Post shared successfully!", { position: "top-right" })
      } else {
        await navigator.clipboard.writeText(postUrl)
        toast.success("Link copied to clipboard!", { position: "top-right" })
      }
    } catch (err) {
      console.error("Sharing error:", err)
      toast.error("Sharing failed. Please try again.", { position: "top-right" })
    }
  }, [post?.slug, post?.title])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeSidebarItem={activeSidebarItem}
          setActiveSidebarItem={setActiveSidebarItem}
        />
        <div className="flex-1 flex flex-col min-h-screen w-full">
          <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-red-500 p-4 rounded-lg bg-red-50 border border-red-200">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col min-h-screen w-full">
          <div className="max-w-4xl mx-auto p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-[400px] bg-gray-200 rounded" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeSidebarItem={activeSidebarItem}
        setActiveSidebarItem={setActiveSidebarItem}
      />

      <div className="flex-1 flex flex-col min-h-screen w-full">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isLoggedIn={isLoggedIn} />

        {/* Main content wrapper - Modified to use flex */}
        <div className="flex-1 flex flex-row p-6 gap-6">
          {/* Main content area */}
          <main className="flex-1 max-w-4xl">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
                {post.featuredImage && (
                  <div className="relative w-full h-[300px] mb-4">
                    <Image
                      src={post.featuredImage || "/placeholder.svg"}
                      alt={post.title}
                      fill
                      priority
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}

                {/* Author info and interactions remain the same */}
                <div className="flex items-center mb-4">
                  <Image
                    src={post.channelLogo || "/placeholder.svg"}
                    alt={`${post.author} Logo`}
                    width={30}
                    height={30}
                    className="rounded-full mr-2"
                  />
                  <div>
                    <span className="font-semibold">{post.author}</span>
                    <div className="text-sm text-gray-500">
                      <span>Published on Biz • </span>
                      {/* Display calculated reading time */}
                      <span>
                        {readingTime === null ? "Calculating..." : `${readingTime} min read`} •
                      </span>
                      <span>{format(new Date(post.createdAt), "MMMM dd, yyyy")}</span>
                    </div>
                  </div>
                  <button
                    className="ml-auto bg-[#2A2FB8] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    onClick={toggleFollow}
                    disabled={isLoading}
                  >
                    {isLoading ? "Following..." : isFollowing ? "Unfollow" : "Follow"}
                  </button>
                </div>

                {/* Social interactions remain the same */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleLike}
                      className={`flex items-center space-x-1 ${hasLiked ? "text-blue-500" : "text-gray-600"}`}
                    >
                      <Image
                        src={hasLiked ? `/uploads/filledlike.svg` : `/uploads/Like.svg`}
                        alt="like"
                        width={40}
                        height={40}
                      />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={handleDislike}
                      className={`flex items-center space-x-1 ${hasDisliked ? "text-red-500" : "text-gray-600"}`}
                    >
                      <Image
                        src={`/uploads/Dislike.png`}
                        alt="dislike"
                        width={40}
                        height={40}
                        style={{
                          filter: hasDisliked
                            ? "invert(16%) sepia(91%) saturate(7477%) hue-rotate(359deg) brightness(98%) contrast(117%)"
                            : "none",
                        }}
                      />
                      <span>{post.dislikes}</span>
                    </button>
                    <span className="text-gray-600">{post.views} views</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button onClick={handleSave} className={isSaved ? "text-blue-500" : "text-gray-600"}>
                      <Image
                        src={isSaved ? `/uploads/filledsaved.svg` : `/uploads/Save.png`}
                        alt="save"
                        width={40}
                        height={40}
                      />
                    </button>
                    <button onClick={handleShare}>
                      <Image src="/uploads/Share.png" alt="share" width={40} height={40} />
                    </button>
                  </div>
                </div>

                {/* Post content remains the same */}
                <div className="prose max-w-none mt-6" dangerouslySetInnerHTML={{ __html: post.content }} />

                <div className="mt-4">
                  <Link href={`/blog/posts/${post.slug}`} className="text-blue-600 font-medium flex items-center gap-1">
                    View more
                    <ArrowRight className="text-blue-600" size={18} />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </main>

          {/* Aside section - Modified for better positioning */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-6">
              <h2 className="text-xl text-center font-semibold mb-4">Read more Blogs</h2>
              <div className="space-y-4">
                {relatedPosts.map((relatedPost) => (
                  <Link href={`/blog/posts/${relatedPost.slug}`} key={relatedPost._id}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow border-none bg-gray-50">
                      <CardContent className="p-4">
                        <div className="relative h-32 mb-2">
                          <Image
                            src={relatedPost.featuredImage || "/placeholder.svg"}
                            alt={relatedPost.title}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{relatedPost.title}</h3>
                        <div className="flex items-center mb-1">
                          <Image
                            src={relatedPost.channelLogo || "/placeholder.svg"}
                            alt={`${relatedPost.author} Logo`}
                            width={20}
                            height={20}
                            className="rounded-full mr-1"
                          />
                          <span className="font-semibold text-sm mr-1">{relatedPost.author}</span>
                          <CheckCircle size={14} className="text-blue-600" />
                        </div>
                        <div className="flex items-center ml-6 text-xs text-gray-500">
                          <span>{relatedPost.views} views</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/blog/posts/${post.slug}`}
        title={post.title}
      />
    </div>
  )
}