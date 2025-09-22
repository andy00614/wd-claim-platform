'use client'

import { useState, useEffect } from 'react'
import { convertPdfToImages } from '@/lib/pdf-converter'
import { FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PdfPreviewProps {
  url: string
  fileName: string
  maxPages?: number
  className?: string
}

interface PdfPage {
  pageNumber: number
  imageDataUrl: string
  width: number
  height: number
}

export default function PdfPreview({ url, fileName, maxPages = 3, className = '' }: PdfPreviewProps) {
  const [pages, setPages] = useState<PdfPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPdfPages()
  }, [])

  const loadPdfPages = async () => {
    setLoading(true)
    setError(null)

    try {
      const convertedPages = await convertPdfToImages({
        url,
        maxPages,
        scale: 2.0
      })
      setPages(convertedPages)
    } catch (err) {
      console.error('Failed to convert PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PDF preview')
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-gray-600">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`py-4 ${className}`}>
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Open PDF
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {pages.map((page) => (
        <img
          key={page.pageNumber}
          src={page.imageDataUrl}
          alt={`${fileName} - Page ${page.pageNumber}`}
          className="w-full h-auto"
        />
      ))}
    </div>
  )
}