"use client"

import { useEffect, useState } from "react"
import DOMPurify from "dompurify"
import styles from "./pdf-content.module.css"

interface PDFContentRendererProps {
  htmlContentUrl: string
  title: string
}

export default function PDFContentRenderer({ htmlContentUrl }: PDFContentRendererProps) {
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (htmlContentUrl) {
      setIsLoading(true)
      fetch(htmlContentUrl)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch HTML")
          return response.text()
        })
        .then((html) => {
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, "text/html")

          // Process the HTML to improve layout
          processHtmlForBetterLayout(doc)

          const bodyContent = doc.body.innerHTML
          const sanitizedHtml = DOMPurify.sanitize(bodyContent, {
            ADD_ATTR: ["class", "style"],
          })

          setHtmlContent(sanitizedHtml)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error("Error fetching HTML content:", err)
          setError("Failed to load document content")
          setIsLoading(false)
        })
    }
  }, [htmlContentUrl])

  // Function to process HTML for better layout
  const processHtmlForBetterLayout = (doc: Document) => {
    // Add classes to common PDF elements
    const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6")
    headings.forEach((heading) => {
      heading.classList.add("pdf-heading")
    })

    // Process paragraphs
    const paragraphs = doc.querySelectorAll("p")
    paragraphs.forEach((paragraph) => {
      paragraph.classList.add("pdf-paragraph")

      // Check if paragraph is likely a heading based on font size or weight
      const style = window.getComputedStyle(paragraph)
      const fontSize = Number.parseInt(style.fontSize)
      const fontWeight = style.fontWeight

      if (fontSize > 14 || Number.parseInt(fontWeight) >= 600) {
        paragraph.classList.add("pdf-heading-paragraph")
      }
    })

    // Process divs that might be columns
    const divs = doc.querySelectorAll("div")
    divs.forEach((div) => {
      // Check if div might be a column
      if (div.children.length > 0 && div.offsetWidth < 500) {
        div.classList.add("pdf-column")
      }
    })
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-40">Loading document...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4 border border-red-300 rounded">{error}</div>
  }

  return (
    <div className="pdf-document-container">
      <div className={styles.pdfContent}>
        <div className={styles.pdfRenderer} dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  )
}

