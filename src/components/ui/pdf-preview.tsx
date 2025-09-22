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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (showPreview && pages.length === 0) {
      loadPdfPages()
    }
  }, [showPreview])

  const loadPdfPages = async () => {
    setLoading(true)
    setError(null)

    try {
      const convertedPages = await convertPdfToImages({
        url,
        maxPages,
        scale: 1.2
      })
      setPages(convertedPages)
    } catch (err) {
      console.error('Failed to convert PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PDF preview')
    } finally {
      setLoading(false)
    }
  }

  if (!showPreview) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center mb-3">
          <FileText className="h-12 w-12 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 mb-2">PDF Document</p>
          <p className="text-xs text-gray-600 mb-3 truncate">{fileName}</p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowPreview(true)}
            >
              <FileText className="h-3 w-3 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open(url, '_blank')}
            >
              <FileText className="h-3 w-3 mr-1" />
              Open PDF
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center mb-3">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Loading PDF preview...</p>
          <p className="text-xs text-gray-600 mt-1">Converting to images</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center mb-3">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 mb-2">Preview Error</p>
          <p className="text-xs text-gray-600 mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => window.open(url, '_blank')}
          >
            <FileText className="h-3 w-3 mr-1" />
            Open Original
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">PDF Preview</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setShowPreview(false)}
        >
          Hide Preview
        </Button>
      </div>

      {pages.map((page) => (
        <div key={page.pageNumber} className="border rounded-lg overflow-hidden bg-white">
          <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
            Page {page.pageNumber}
          </div>
          <div className="p-3">
            <img
              src={page.imageDataUrl}
              alt={`${fileName} - Page ${page.pageNumber}`}
              className="w-full max-h-64 object-contain bg-gray-100 rounded border"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>
      ))}

      {pages.length > 0 && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => window.open(url, '_blank')}
          >
            <FileText className="h-3 w-3 mr-1" />
            View Full PDF
          </Button>
        </div>
      )}
    </div>
  )
}