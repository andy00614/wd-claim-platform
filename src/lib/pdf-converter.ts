'use client'

// Only import PDF.js on client side
let pdfjsLib: any = null

// Dynamic import for client-side only
if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((module) => {
    pdfjsLib = module
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  })
}

interface ConvertPdfToImagesOptions {
  url: string
  maxPages?: number
  scale?: number
}

interface ConvertedPage {
  pageNumber: number
  imageDataUrl: string
  width: number
  height: number
}

export async function convertPdfToImages(
  options: ConvertPdfToImagesOptions
): Promise<ConvertedPage[]> {
  try {
    // Ensure we're on client side
    if (typeof window === 'undefined') {
      throw new Error('PDF conversion can only be performed on client side')
    }

    // Dynamic import for PDF.js
    const pdfjsModule = await import('pdfjs-dist')

    // Set up worker if not already set
    if (!pdfjsModule.GlobalWorkerOptions.workerSrc) {
      pdfjsModule.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsModule.version}/pdf.worker.min.js`
    }

    const { url, maxPages = 5, scale = 1.5 } = options

    // Load PDF document
    const pdf = await pdfjsModule.getDocument(url).promise
    const totalPages = Math.min(pdf.numPages, maxPages)
    const convertedPages: ConvertedPage[] = []

    // Convert each page to image
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      // Create canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Could not get 2D context from canvas')
      }

      canvas.height = viewport.height
      canvas.width = viewport.width

      // Render page to canvas
      const renderContext = {
        canvas: canvas,
        canvasContext: context,
        viewport: viewport,
      }

      await page.render(renderContext).promise

      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/png', 0.9)

      convertedPages.push({
        pageNumber: pageNum,
        imageDataUrl,
        width: viewport.width,
        height: viewport.height,
      })
    }

    return convertedPages
  } catch (error) {
    console.error('Error converting PDF to images:', error)
    throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Client-side only function to check if PDF.js is available
export function isPdfJsAvailable(): boolean {
  return typeof window !== 'undefined' && typeof pdfjsLib !== 'undefined'
}