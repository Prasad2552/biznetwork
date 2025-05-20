// src/app/documents/[slug]/metadata.ts
import { getPDFDocument } from "@/lib/pdf-utils"
import type { Metadata } from "next"
import type { PageProps } from "./types"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = params.slug
  const document = await getPDFDocument(slug)

  if (!document) {
    return {
      title: "Document Not Found",
    }
  }

  return {
    title: document.title,
    openGraph: {
      title: document.title,
      type: "article",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/documents/${slug}`,
    },
  }
}
