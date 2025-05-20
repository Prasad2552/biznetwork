// src\lib\pdf-utils.ts
import { PDFDocument } from '@/types/pdf'

export async function getPDFDocument(slug: string): Promise<PDFDocument | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/${slug}`)
    if (!response.ok) return null
    return response.json()
  } catch (error) {
    console.error('Error fetching PDF document:', error)
    return null
  }
}