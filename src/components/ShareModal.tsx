//src\components\ShareModal.tsx
import type React from "react"
import {
  FacebookShareButton,
  WhatsappShareButton,
  TwitterShareButton,
  EmailShareButton,
  RedditShareButton,
  FacebookIcon,
  WhatsappIcon,
  TwitterIcon,
  EmailIcon,
  RedditIcon,
} from "react-share"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-toastify"
import { useState } from "react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
  title: string
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, title }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true);
      toast.success("Link copied to clipboard!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      })
        setTimeout(() => {
            setIsCopied(false);
        }, 2000); // Reset after 2 seconds
    } catch (err) {
      toast.error("Failed to copy link", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-none shadow-lg">
        <div className="flex items-center justify-between">
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-5 gap-4 my-4 place-items-center">
          <FacebookShareButton url={shareUrl} title={title}>
            <FacebookIcon size={48} round />
          </FacebookShareButton>

          <WhatsappShareButton url={shareUrl} title={title}>
            <WhatsappIcon size={48} round />
          </WhatsappShareButton>

          <TwitterShareButton url={shareUrl} title={title}>
            <TwitterIcon size={48} round />
          </TwitterShareButton>

          <EmailShareButton url={shareUrl} subject={title} body={shareUrl}>
            <EmailIcon size={48} round />
          </EmailShareButton>

          <RedditShareButton url={shareUrl} title={title}>
            <RedditIcon size={48} round />
          </RedditShareButton>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={shareUrl}
            className="flex-1 rounded-md bg-gray-700 text-white border-none focus:ring-blue-500"
            readOnly
          />
          <Button
            variant="default"
            className="bg-blue-600 text-white hover:bg-blue-500 rounded-md whitespace-nowrap"
            onClick={handleCopyToClipboard}
            disabled={isCopied}
          >
            {isCopied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareModal