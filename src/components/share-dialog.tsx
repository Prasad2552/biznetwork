import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Twitter, LinkedinIcon, Link2, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "react-toastify"

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
  videoTitle?: string; // Changed to optional
  videoType?: string 
}

export function ShareDialog({ isOpen, onClose, videoId, videoTitle, videoType = "videos" }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  // Generate the video URL with the correct format
  const generateVideoUrl = () => {
    // Added fallback for videoTitle 
    const slug = (videoTitle || "untitled-video")?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const baseUrl = window.location.origin
      
    const type = videoType?.toLowerCase()?.endsWith("s") ? videoType?.toLowerCase() : `${videoType?.toLowerCase()}s`;
    return `${baseUrl}/${type}/${videoId}/${slug}`
  }

  const videoUrl = generateVideoUrl()

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(videoTitle || '')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`,
  }

  const handleSocialShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], "_blank", "width=600,height=400")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share video</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <Input value={videoUrl} readOnly className="flex-1" />
          <Button variant="secondary" onClick={handleCopyLink} className="px-3 flex gap-2 items-center">
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button variant="outline" className="flex gap-2 items-center" onClick={() => handleSocialShare("facebook")}>
            <Facebook className="h-4 w-4" />
            Facebook
          </Button>
          <Button variant="outline" className="flex gap-2 items-center" onClick={() => handleSocialShare("twitter")}>
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          <Button variant="outline" className="flex gap-2 items-center" onClick={() => handleSocialShare("linkedin")}>
            <LinkedinIcon className="h-4 w-4" />
            LinkedIn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}