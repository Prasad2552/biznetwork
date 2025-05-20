/**
 * Enhanced PDF to HTML processor utility functions
 */

/**
 * Processes HTML content extracted from PDF to improve layout fidelity
 * @param htmlContent The raw HTML content extracted from PDF
 * @returns Processed HTML with improved layout
 */
export function enhancePdfHtmlLayout(htmlContent: string): string {
    // Create a document fragment to work with the HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, "text/html")
  
    // Apply white paper specific layout
    applyWhitePaperLayout(doc)
  
    // Fix common PDF conversion issues
    fixCommonPdfConversionIssues(doc)
  
    // Add responsive layout classes
    addResponsiveLayoutClasses(doc)
  
    // Return the processed HTML
    return doc.body.innerHTML
  }
  
  /**
   * Applies white paper specific layout enhancements
   */
  function applyWhitePaperLayout(doc: Document): void {
    // Find the title and apply special styling
    const possibleTitles = doc.querySelectorAll(
      'h1, h2, p[style*="font-size: 18px"], p[style*="font-size: 20px"], p[style*="font-size: 22px"], p[style*="font-size: 24px"]',
    )
  
    if (possibleTitles.length > 0) {
      const title = possibleTitles[0]
      title.classList.add("white-paper-title")
    }
  
    // Find sections and apply styling
    const sections = doc.querySelectorAll('h2, h3, p[style*="font-size: 16px"], p[style*="font-size: 18px"]')
    sections.forEach((section) => {
      if (!section.classList.contains("white-paper-title")) {
        section.classList.add("white-paper-section")
      }
    })
  
    // Look for sidebar content (often in colored divs or with specific styling)
    const possibleSidebars = doc.querySelectorAll(
      'div[style*="background"], div[style*="color: white"], div[style*="color: #fff"]',
    )
    possibleSidebars.forEach((sidebar) => {
      sidebar.classList.add("white-paper-sidebar")
    })
  
    // Create two-column layout where appropriate
    createTwoColumnLayout(doc)
  }
  
  /**
   * Creates a two-column layout for appropriate content
   */
  function createTwoColumnLayout(doc: Document): void {
    // Find potential content that should be in two columns
    const contentSections = doc.querySelectorAll("div > p:nth-child(n+3)")
  
    contentSections.forEach((section) => {
      const parent = section.parentElement
      if (parent && parent.children.length >= 5) {
        parent.classList.add("two-column-layout")
  
        // Create left column for first few elements
        const leftColumn = doc.createElement("div")
        leftColumn.classList.add("column-left")
  
        // Create right column for remaining elements
        const rightColumn = doc.createElement("div")
        rightColumn.classList.add("column-right")
  
        // Distribute content between columns
        const totalChildren = parent.children.length
        const leftColumnCount = Math.min(2, Math.floor(totalChildren / 3))
  
        // Clone nodes to avoid issues when moving them
        for (let i = 0; i < leftColumnCount; i++) {
          leftColumn.appendChild(parent.children[0].cloneNode(true))
        }
  
        for (let i = leftColumnCount; i < totalChildren; i++) {
          rightColumn.appendChild(parent.children[leftColumnCount].cloneNode(true))
        }
  
        // Remove original children
        while (parent.firstChild) {
          parent.removeChild(parent.firstChild)
        }
  
        // Add the new columns
        parent.appendChild(leftColumn)
        parent.appendChild(rightColumn)
      }
    })
  }
  
  /**
   * Fixes common PDF conversion issues
   */
  function fixCommonPdfConversionIssues(doc: Document): void {
    // Fix line breaks that should be paragraphs
    const brTags = doc.querySelectorAll("br")
    brTags.forEach((br) => {
      if (br.nextSibling && br.nextSibling.nodeType === Node.TEXT_NODE && br.nextSibling.textContent?.trim()) {
        const newP = doc.createElement("p")
        newP.classList.add("pdf-paragraph")
        newP.textContent = br.nextSibling.textContent
        br.parentNode?.replaceChild(newP, br.nextSibling)
        br.parentNode?.removeChild(br)
      }
    })
  
    // Fix inconsistent font sizes
    const allElements = doc.querySelectorAll('*[style*="font-size"]')
    allElements.forEach((el) => {
      const style = el.getAttribute("style") || ""
      if (style.includes("font-size: 1px") || style.includes("font-size: 0px")) {
        el.setAttribute("style", style.replace(/font-size:[^;]+;?/, ""))
      }
    })
  
    // Fix overlapping text
    const paragraphs = doc.querySelectorAll("p")
    paragraphs.forEach((p) => {
      p.style.position = "static" // Remove absolute positioning that causes overlaps
    })
  }
  
  /**
   * Adds responsive layout classes
   */
  function addResponsiveLayoutClasses(doc: Document): void {
    // Add container class to main content div
    const mainContent = doc.querySelector("body > div")
    if (mainContent) {
      mainContent.classList.add("pdf-main-content")
    }
  
    // Make images responsive
    const images = doc.querySelectorAll("img")
    images.forEach((img) => {
      img.classList.add("pdf-responsive-image")
      img.style.maxWidth = "100%"
      img.style.height = "auto"
    })
  }
  
  