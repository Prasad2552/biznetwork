// src/components/content-grid.tsx
import { ContentCard } from "./content-card"
import type { Content } from "@/types/common"
import type { Channel } from "@/types/channel" // Import Channel type

interface ContentGridProps {
  contents: Content[]
  type?: string
  channel?: Channel | null // Add the channel prop here
}

export function ContentGrid({ contents, type, channel }: ContentGridProps) {  // Include channel in the props
    console.log("ContentGrid received contents:", contents);
  if (!contents.length) {
    return <div className="text-center py-8 text-gray-500">No {type?.toLowerCase() || "content"} available yet</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contents.map((content) => (
        <ContentCard key={content._id} content={content} channel={channel} /> // Pass channel prop here
      ))}
    </div>
  )
}