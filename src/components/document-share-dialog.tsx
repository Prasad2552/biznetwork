import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Twitter, LinkedinIcon, Link2, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "react-toastify"

interface DocumentShareDialogProps {
  isOpen: boolean
  onClose: () => void
  documentSlug: string
  documentTitle: string
}

export function DocumentShareDialog({ isOpen, onClose, documentSlug, documentTitle }: DocumentShareDialogProps) {
  const [copied, setCopied] = useState(false)

  // Generate the document URL
  const generateDocumentUrl = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/documents/${documentSlug}`
  }

  const documentUrl = generateDocumentUrl()

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(documentUrl)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(documentUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(documentUrl)}&text=${encodeURIComponent(documentTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(documentUrl)}`,
  }

  const handleSocialShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], "_blank", "width=600,height=400")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <Input value={documentUrl} readOnly className="flex-1" />
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

