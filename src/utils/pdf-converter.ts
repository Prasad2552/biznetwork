import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export async function convertPDFToHTML(pdfBuffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise
  let htmlContent = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()

    htmlContent += `<div class="pdf-page" style="position: relative; width: ${viewport.width}px; margin-bottom: 20px;">
      ${textContent.items.map((item: any) => {
        const transform = item.transform
        const x = transform[4]
        const y = viewport.height - transform[5]
        return `<span style="position: absolute; left: ${x}px; top: ${y}px; font-size: ${transform[0]}px; font-family: sans-serif;">${item.str}</span>`
      }).join('')}
    </div>`
  }

  return htmlContent
}

