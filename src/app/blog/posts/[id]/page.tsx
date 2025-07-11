"use client";

import { useEffect, useState, useCallback, useRef, startTransition } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useChannelFollow } from "@/hooks/useChannelFollow";

// Dynamically import heavy components
const Sidebar = dynamic(() => import("@/components/sidebar"), { ssr: false });
const Header = dynamic(() => import("@/components/header"), { ssr: false });
const ShareModal = dynamic(() => import("@/components/ShareModal"), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full" />,
});

interface BlogPost {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  featuredImage?: string;
  channelId?: string;
  views?: number;
  likes?: number;
  dislikes?: number;
  slug?: string;
  channelLogo?: string;
  type?: "blogpost" | "technews";
}

interface SidebarBlogPost {
  _id: string;
  title: string;
  author: string;
  views: number;
  featuredImage?: string;
  slug?: string;
  channelLogo?: string;
}

// Function to calculate estimated reading time
const calculateReadingTime = (content: string): number => {
  const text = content.replace(/<[^>]*>/g, "");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / 200);
};

// Author Info Component
const AuthorInfo = ({
  author,
  channelLogo,
  readingTime,
  createdAt,
  isFollowing,
  isLoading,
  toggleFollow
}: {
  author: string;
  channelLogo?: string;
  readingTime: number | null;
  createdAt: string;
  isFollowing: boolean;
  isLoading: boolean;
  toggleFollow: () => void;
}) => (
  <div className="flex items-center mb-4">
    <Image
      src={channelLogo || "/placeholder.svg"}
      alt={`${author} Logo`}
      width={30}
      height={30}
      className="rounded-full mr-2"
    />
    <div>
      <span className="font-semibold">{author}</span>
      <div className="text-sm text-gray-500">
        <span>Published on Biz • </span>
        <span>
          {readingTime === null ? "Calculating..." : `${readingTime} min read`} •
        </span>
        <span>{format(new Date(createdAt), "MMMM dd, yyyy")}</span>
      </div>
    </div>
    <button
      className="ml-auto bg-[#2A2FB8] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      onClick={toggleFollow}
      disabled={isLoading}
      aria-label={isFollowing ? "Unfollow channel" : "Follow channel"}
    >
      {isLoading ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  </div>
);

// Interaction Buttons Component
const InteractionButtons = ({
  hasLiked,
  hasDisliked,
  isSaved,
  likes,
  dislikes,
  views,
  onLike,
  onDislike,
  onSave,
  onShare
}: {
  hasLiked: boolean;
  hasDisliked: boolean;
  isSaved: boolean;
  likes: number;
  dislikes: number;
  views: number;
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  onShare: () => void;
}) => (
  <div className="mt-6 flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <button
        onClick={onLike}
        className={`flex items-center space-x-1 ${hasLiked ? "text-blue-500" : "text-gray-600"}`}
        aria-label={hasLiked ? "Remove like" : "Like post"}
      >
        <Image
          src={hasLiked ? `/uploads/filledlike.svg` : `/uploads/Like.svg`}
          alt="Like"
          width={24}
          height={24}
        />
        <span>{likes}</span>
      </button>
      
      <button
        onClick={onDislike}
        className={`flex items-center space-x-1 ${hasDisliked ? "text-red-500" : "text-gray-600"}`}
        aria-label={hasDisliked ? "Remove dislike" : "Dislike post"}
      >
        <Image
          src={`/uploads/Dislike.png`}
          alt="Dislike"
          width={24}
          height={24}
          className={hasDisliked ? "filter-red" : ""}
        />
        <span>{dislikes}</span>
      </button>
      
      <span className="text-gray-600">{views} views</span>
    </div>

    <div className="flex items-center space-x-2">
      <button 
        onClick={onSave} 
        className={isSaved ? "text-blue-500" : "text-gray-600"}
        aria-label={isSaved ? "Unsave post" : "Save post"}
      >
        <Image
          src={isSaved ? `/uploads/filledsaved.svg` : `/uploads/Save.png`}
          alt="Save"
          width={24}
          height={24}
        />
      </button>
      
      <button 
        onClick={onShare}
        aria-label="Share post"
      >
        <Image src="/uploads/Share.png" alt="Share" width={24} height={24} />
      </button>
    </div>
  </div>
);

// Related Posts Component
const RelatedPosts = ({ posts }: { posts: SidebarBlogPost[] }) => (
  <aside className="hidden lg:block w-72 flex-shrink-0">
    <div className="sticky top-6">
      <h2 className="text-xl font-semibold mb-4">Read more Blogs</h2>
      <div className="space-y-4">
        {posts.map(post => (
          <Link href={`/blog/posts/${post.slug}`} key={post._id}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="relative h-32 mb-2">
                  <Image
                    src={post.featuredImage || "/placeholder.svg"}
                    alt={post.title}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{post.title}</h3>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{post.views} views</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </aside>
);

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="h-64 bg-gray-200 rounded" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-full" />
        ))}
      </div>
    </div>
  </div>
);

export default function BlogPost({ params }: { params: Promise<{ id: string }> }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<SidebarBlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState("Home");
  const { data: session } = useSession();
  const userId = session?.user?.id || null;
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const actionInProgress = useRef(false);
  const { token, isUserLoggedIn } = useAuthCheck();
  const { id } = params;

  const { 
    isFollowing, 
    toggleFollow, 
    isLoading: isFollowLoading 
  } = useChannelFollow(post?.channelId || "");

  // Fetch post data
  const fetchData = useCallback(async () => {
    try {
      const [postRes, relatedRes] = await Promise.all([
        fetch(`/api/blog/posts/${id}`),
        fetch(`/api/blog/related-posts/${id}`)
      ]);

      if (!postRes.ok) throw new Error("Failed to fetch blog post");
      const postData: BlogPost = await postRes.json();

      const relatedData = relatedRes.ok 
        ? (await relatedRes.json()).posts.slice(0, 5) 
        : [];

      return { postData, relatedData };
    } catch (error) {
      setError("Error loading content");
      console.error(error);
      return { postData: null, relatedData: [] };
    }
  }, [id]);

  // Fetch user interactions
  const fetchUserInteractions = useCallback(async (postId: string) => {
    if (!userId) return { hasLiked: false, hasDisliked: false, isSaved: false };
    
    try {
      const response = await fetch(`/api/users/interactions?postId=${postId}&userId=${userId}`);
      return response.ok ? await response.json() : { hasLiked: false, hasDisliked: false, isSaved: false };
    } catch (error) {
      console.error("Interaction fetch error:", error);
      return { hasLiked: false, hasDisliked: false, isSaved: false };
    }
  }, [userId]);

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      const { postData, relatedData } = await fetchData();
      if (!postData) return;

      const interactions = await fetchUserInteractions(postData._id);
      
      startTransition(() => {
        setPost(postData);
        setRelatedPosts(relatedData);
        setHasLiked(interactions.hasLiked);
        setHasDisliked(interactions.hasDisliked);
        setIsSaved(interactions.isSaved);
      });
    };

    loadData();
  }, [id, fetchData, fetchUserInteractions]);

  // Calculate reading time
  const readingTime = post?.content ? calculateReadingTime(post.content) : null;

  // Generic action handler
  const performAction = useCallback(
    async (action: () => Promise<void>, successMsg: string, errorMsg: string) => {
      if (actionInProgress.current) return;
      actionInProgress.current = true;

      try {
        await action();
        toast.success(successMsg, { position: "top-right" });
      } catch (error) {
        console.error("Action error:", error);
        toast.error(errorMsg, { position: "top-right" });
      } finally {
        actionInProgress.current = false;
      }
    },
    []
  );

  // Like handler
  const handleLike = useCallback(async () => {
    if (!userId || !post?._id) {
      toast.warn("Please log in to like this post");
      return;
    }

    await performAction(
      async () => {
        const res = await fetch("/api/users/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post._id, userId })
        });
        if (!res.ok) throw new Error("Like action failed");

        setHasLiked(prev => !prev);
        setHasDisliked(false);
        setPost(prev => prev ? {
          ...prev,
          likes: hasLiked ? (prev.likes || 1) - 1 : (prev.likes || 0) + 1,
          dislikes: hasDisliked ? (prev.dislikes || 1) - 1 : prev.dislikes
        } : prev);
      },
      hasLiked ? "Like removed!" : "Post liked!",
      "Like action failed"
    );
  }, [userId, post, hasLiked, hasDisliked, performAction]);

  // Dislike handler
  const handleDislike = useCallback(async () => {
    if (!userId || !post?._id) {
      toast.warn("Please log in to dislike this post");
      return;
    }

    await performAction(
      async () => {
        const res = await fetch("/api/users/dislike", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post._id, userId })
        });
        if (!res.ok) throw new Error("Dislike action failed");

        setHasDisliked(prev => !prev);
        setHasLiked(false);
        setPost(prev => prev ? {
          ...prev,
          dislikes: hasDisliked ? (prev.dislikes || 1) - 1 : (prev.dislikes || 0) + 1,
          likes: hasLiked ? (prev.likes || 1) - 1 : prev.likes
        } : prev);
      },
      hasDisliked ? "Dislike removed!" : "Post disliked!",
      "Dislike action failed"
    );
  }, [userId, post, hasDisliked, hasLiked, performAction]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!userId || !post?._id) {
      toast.warn("Please log in to save this post");
      return;
    }

    await performAction(
      async () => {
        const payload = {
          userId,
          ...(post?.type === "technews" 
            ? { techNewsId: post._id } 
            : { postId: post._id })
        };

        const res = await fetch("/api/users/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Save action failed");

        setIsSaved(prev => !prev);
      },
      isSaved ? "Post unsaved!" : "Post saved!",
      "Save action failed"
    );
  }, [userId, post, isSaved, performAction]);

  // Share handler
  const handleShare = useCallback(async () => {
    if (!post?.slug) return;

    const postUrl = `${window.location.origin}/blog/posts/${post.slug}`;
    
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: post.title, 
          url: postUrl 
        });
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Sharing error:", err);
      toast.error("Sharing failed");
    }
  }, [post]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeSidebarItem={activeSidebarItem}
          setActiveSidebarItem={setActiveSidebarItem}
          token={token || ""}
          isUserLoggedIn={!!isUserLoggedIn}
        />
        <div className="flex-1 flex flex-col min-h-screen w-full">
          <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-red-500 p-4 rounded-lg bg-red-50 border border-red-200">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeSidebarItem={activeSidebarItem}
        setActiveSidebarItem={setActiveSidebarItem}
        token={token || ""}
        isUserLoggedIn={!!isUserLoggedIn}
      />

      <div className="flex-1 flex flex-col min-h-screen w-full">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 flex flex-col md:flex-row p-6 gap-6">
          {/* Main Content */}
          {!post ? (
            <SkeletonLoader />
          ) : (
            <main className="flex-1 max-w-4xl">
              <Card>
                <CardContent className="p-6">
                  <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>
                  
                  {post.featuredImage && (
                    <div className="relative w-full h-64 md:h-[400px] mb-4">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        priority
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  <AuthorInfo
                    author={post.author}
                    channelLogo={post.channelLogo}
                    readingTime={readingTime}
                    createdAt={post.createdAt}
                    isFollowing={isFollowing}
                    isLoading={isFollowLoading}
                    toggleFollow={toggleFollow}
                  />

                  <InteractionButtons
                    hasLiked={hasLiked}
                    hasDisliked={hasDisliked}
                    isSaved={isSaved}
                    likes={post.likes || 0}
                    dislikes={post.dislikes || 0}
                    views={post.views || 0}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onSave={handleSave}
                    onShare={handleShare}
                  />

                  <article 
                    className="prose max-w-none mt-6" 
                    dangerouslySetInnerHTML={{ __html: post.content }} 
                  />

                  <div className="mt-6">
                    <Link 
                      href={`/blog/posts/${post.slug}`} 
                      className="text-blue-600 font-medium flex items-center gap-1"
                    >
                      Continue reading
                      <ArrowRight className="text-blue-600" size={18} />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </main>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
        </div>
      </div>
    </div>
  );
}
