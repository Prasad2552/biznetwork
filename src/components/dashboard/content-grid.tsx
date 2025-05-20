import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import { ContentItem } from "@/types/content-item"
import { Skeleton } from "@/components/ui/skeleton"

interface ContentGridProps {
  items: ContentItem[]
  onRemove?: (id: string) => void
  onItemClick?: (item: ContentItem) => void
  getIcon?: (type: string) => React.ReactNode
  isLoading?: boolean
  activeTab?: string
}

export function ContentGrid({ 
  items, 
  onRemove, 
  onItemClick, 
  getIcon,
  isLoading,
  activeTab 
}: ContentGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[300px] rounded-lg" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <p className="text-muted-foreground">No content found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card 
          key={item._id} 
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onItemClick?.(item)}
        >
          <div className="aspect-video relative">
            <img
              src={item.thumbnailUrl || '/placeholder.svg'}
              alt={item.title}
              className="object-cover w-full h-full"
            />
            <div className="absolute top-2 right-2 bg-background/80 px-2 py-1 rounded-full text-xs">
              {getIcon?.(item.type)}
            </div>
          </div>
          <CardHeader className="space-y-0 p-4">
            <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
            <CardDescription className="line-clamp-2">{item.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {new Date(item.uploadDate).toLocaleDateString()}
            </span>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(item._id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

