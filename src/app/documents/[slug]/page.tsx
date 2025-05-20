// src/app/documents/[slug]/page.tsx
import { notFound } from "next/navigation"
import { getPDFDocument } from "@/lib/pdf-utils"
import type { PDFDocument } from "@/types/pdf"
import DocumentPageClient from "./DocumentPageClient"
import type { PageProps } from "./types"

async function fetchChannelData(channelId: string): Promise<{ logo: string; name: string }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/channels/${channelId}`, {
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`Failed to fetch channel ${channelId}`)

    const data = await res.json()
    return {
      logo: data.logo,
      name: data.name,
    }
  } catch (err) {
    console.error(`Error fetching channel ${channelId}:`, err)
    return {
      logo: "/uploads/companyLogo_1732956327585_Ellipse 117.png",
      name: "Unknown Channel",
    }
  }
}

export default async function DocumentPage({ params }: PageProps) {
  const slug = params.slug
  const document = await getPDFDocument(slug)

  if (!document) notFound()

  const channelData = await fetchChannelData(document.channelId)
  document.channelLogo = channelData.logo
  document.channelName = channelData.name

  let relatedDocuments: PDFDocument[] = []

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf-documents`, {
      cache: "no-store",
    })

    if (res.ok) {
      const allDocs: PDFDocument[] = await res.json()
      const filtered = allDocs
        .filter(doc => doc.type === document.type && doc.id !== document.id)
        .slice(0, 2)

      const relatedWithChannels = await Promise.allSettled(
        filtered.map(async doc => {
          const channel = await fetchChannelData(doc.channelId)
          return {
            ...doc,
            channelLogo: channel.logo,
            channelName: channel.name,
          }
        })
      )

      relatedDocuments = relatedWithChannels
        .filter(result => result.status === "fulfilled")
        .map(result => (result as PromiseFulfilledResult<PDFDocument>).value)
    }
  } catch (err) {
    console.error("Error fetching related documents:", err)
  }

  return <DocumentPageClient document={document} relatedDocuments={relatedDocuments} />
}
