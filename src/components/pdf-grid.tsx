"use client"

import type React from "react"
import { useState} from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2 } from "lucide-react"
import type { PDFDocument } from "@/types/pdf"
import { DocumentShareDialog } from "./document-share-dialog"
import { useChannelFollow } from "@/hooks/useChannelFollow"  // Import the hook

interface PDFGridProps {
  documents: PDFDocument[]
  category: string
}

const PlaceholderImage = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-t-lg">
    <FileText className="h-16 w-16 text-gray-400" />
  </div>
)


const PDFGrid: React.FC<PDFGridProps> = ({ documents, category }) => {
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null);

    const handleShare = (doc: PDFDocument) => {
        setSelectedDocument(doc);
        setShareDialogOpen(true);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {documents.map((doc) => (
                    <PDFDocumentCard
                        key={doc.id}
                        doc={doc}
                        handleShare={handleShare}
                    />
                ))}
            </div>

            {selectedDocument && (
                <DocumentShareDialog
                    isOpen={shareDialogOpen}
                    onClose={() => setShareDialogOpen(false)}
                    documentSlug={selectedDocument.slug}
                    documentTitle={selectedDocument.title}
                />
            )}
        </>
    );
};

interface PDFDocumentCardProps {
    doc: PDFDocument;
    handleShare: (doc: PDFDocument) => void;
}

const PDFDocumentCard: React.FC<PDFDocumentCardProps> = ({ doc, handleShare }) => {
    const { isFollowing, toggleFollow, isLoading } = useChannelFollow(doc.channelId);


    return (
        <Card key={doc.id} className="overflow-hidden group shadow-none rounded-xl bg-gray-50 border-none">
            <div className="relative aspect-[16/9] rounded-t-xl overflow-hidden">
                {doc.imageUrl ? (
                    <Image
                        src={doc.imageUrl || "/placeholder.svg"}
                        alt={doc.title}
                        fill
                        className="object-cover transition-transform duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                    />
                ) : (
                    <PlaceholderImage />
                )}
            </div>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                            {doc.channelLogo && (
                                <AvatarImage
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${doc.channelLogo}`}
                                    alt={`${doc.channelName} Logo`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/placeholder.svg"
                                    }}
                                />
                            )}
                            <AvatarFallback>{doc.channelName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>


                        <Link href={`/documents/${doc.slug}`}>
                            <h3 className="font-normal truncate text-sm mb-2 line-clamp-2 hover:text-blue-600 text-[#323232]">{doc.title}</h3>
                            <p className="text-sm font-medium truncate text-[#323232]">
                                {doc.channelName}{" "}
                                <CheckCircle2
                                    className="h-4 w-4 inline text-white"
                                    style={{ fill: "#4F46E5", stroke: "currentColor" }}
                                />
                            </p>
                        </Link>
                    </div></div>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10"
                            onClick={(e) => {
                                e.preventDefault()
                                handleShare(doc)
                            }}
                        >
                            <img src="/uploads/share.png" alt="Share" className="h-8 w-8" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <img src="/uploads/save.png" alt="Save" className="h-8 w-8" />
                        </Button>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-[#2A2FB8] hover:bg-[#3730a3] text-white text-xs rounded-full py-1 px-4 h-8"
                        onClick={toggleFollow}  // Call toggleFollow here
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
export default PDFGrid