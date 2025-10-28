'use client'

import { useState } from 'react'
import { deleteClaimFile } from '@/lib/actions'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface Attachment {
  id: number
  claimId: number | null
  claimItemId: number | null
  fileName: string
  url: string
  fileSize: string
  fileType: string
  createdAt: Date | string | null
  updatedAt: Date | string | null
}

interface ExistingAttachmentsProps {
  attachments: Attachment[]
  title?: string
  onDelete?: () => void
}

export default function ExistingAttachments({
  attachments,
  title = "Existing Attachments",
  onDelete
}: ExistingAttachmentsProps) {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  if (!attachments || attachments.length === 0) {
    return null
  }

  const formatFileSize = (sizeStr: string) => {
    const size = parseFloat(sizeStr)
    if (size < 1024) return `${size}B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
    return `${(size / (1024 * 1024)).toFixed(1)}MB`
  }

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (attachmentId: number, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return
    }

    setDeletingIds(prev => new Set(prev).add(attachmentId))

    try {
      const result = await deleteClaimFile(attachmentId)

      if (result.success) {
        toast.success('Attachment deleted successfully')
        if (onDelete) {
          onDelete()
        } else {
          // 如果没有提供 onDelete 回调，刷新页面
          window.location.reload()
        }
      } else {
        toast.error(result.error || 'Failed to delete attachment')
        setDeletingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(attachmentId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete attachment')
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(attachmentId)
        return newSet
      })
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.fileSize)} • {attachment.fileType}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload(attachment.url, attachment.fileName)}
                className="flex-shrink-0 inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 rounded"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => handleDelete(attachment.id, attachment.fileName)}
                disabled={deletingIds.has(attachment.id)}
                className="flex-shrink-0 inline-flex items-center px-2 py-1 border border-red-300 bg-white text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                title="Delete attachment"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}