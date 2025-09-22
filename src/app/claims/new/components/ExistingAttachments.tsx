'use client'

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
}

export default function ExistingAttachments({
  attachments,
  title = "Existing Attachments"
}: ExistingAttachmentsProps) {

  if (!attachments || attachments.length === 0) {
    return (
      <div className="bg-white border border-gray-300 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-500">No attachments found for this claim.</p>
      </div>
    )
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

  return (
    <div className="bg-white border border-gray-300 p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
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
            <button
              onClick={() => handleDownload(attachment.url, attachment.fileName)}
              className="flex-shrink-0 ml-2 inline-flex items-center px-2 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}