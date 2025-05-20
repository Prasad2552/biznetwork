// src/components/content-card.tsx

import Image from "next/image"
import Link from "next/link"
import { Play, FileText, Mic, Calendar, Video } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Content } from "@/types/common"
import type { Channel } from "@/types/channel" 

interface ContentCardProps {
  content: Content
  channel?: Channel | null
}

export function ContentCard({ content, channel }: ContentCardProps) {
  const getIcon = () => {
    switch (content.type) {
      case "video":
      case "demo":
        return <Play className="w-12 h-12 text-white" />
      case "blogpost":
        return <FileText className="w-12 h-12 text-white" />
      case "podcast":
        return <Mic className="w-12 h-12 text-white" />
      case "event":
      case "webinar":
        return <Calendar className="w-12 h-12 text-white" />
      default:
        return <Video className="w-12 h-12 text-white" />
    }
  }

  const getContentUrl = () => {
    const baseUrl = "videos";
    const id = content._id; // Use content._id
    const slug = content.slug;

    switch (content.type) {
      case "video":
        return `${baseUrl}/${id}/${slug}`;
      case "webinar":
        return `webinars/${id}/${slug}`;
      case "podcast":
        return `${baseUrl}/${id}/${slug}`;
      case "testimonial":
        return `${baseUrl}/${id}/${slug}`;
      case "demo":
        return `${baseUrl}/${id}/${slug}`;
      case "event":
        return `${baseUrl}/${id}/${slug}`;
        //Check this Url is as per with the above changes
      case "blogpost":
        return `/blog/posts/${content.slug}`
      case "case-study":
        return `/documents/${content.slug}`
      case "infographic":
        return `/documents/${content.slug}`
      case "white-paper":
        return `/documents/${content.slug}`
      case "ebook":
          return `/documents/${content.slug}`
      default:
        return `/documents/${content.slug}`;
    }
  };

  return (
    <Link href={getContentUrl()}>
      <div className="group relative flex flex-col overflow-hidden rounded-lg">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
        <Image
            src={content.featureImageUrl || content.thumbnailUrl || "/placeholder.svg"} // Use featuredImage or thumbnailUrl
            alt={content.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            {getIcon()}
          </div>
        </div>

        {/* Content Info */}
        <div className="p-3">
          <h3 className="font-semibold line-clamp-2">{content.title}</h3>
          <div className="mt-2 flex items-center gap-2">
          <Image
              src={channel?.logo || content.channelLogo || "/placeholder.svg"} // Use optional chaining
              alt={channel?.name || content.channel || "Channel"} // Use optional chaining
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm text-gray-600">{channel?.name || content.channel}</span> 
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <span>{content.views?.toLocaleString()} views</span>
            <span>•</span>
            <span>
              {content.uploadDate
                ? formatDistanceToNow(new Date(content.uploadDate), {
                    addSuffix: true,
                  })
                : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}