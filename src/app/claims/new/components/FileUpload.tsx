'use client'

import { useRef } from 'react'

interface FileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    addFiles(selectedFiles)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFiles = Array.from(event.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]

      if (file.size > maxSize) {
        alert(`文件 "${file.name}" 过大，最大支持10MB`)
        return false
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`文件 "${file.name}" 格式不支持`)
        return false
      }

      return true
    })

    onFilesChange([...files, ...validFiles])
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="bg-white border border-gray-300 p-4 mb-6">
      <h3 className="text-md font-semibold mb-4 pb-2 border-b border-gray-200">
        Supporting Documents
      </h3>

      {/* 文件上传区域 */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-500 hover:bg-gray-50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 border border-black bg-white hover:bg-gray-50 transition-colors"
        >
          Choose Files
        </button>
        
        <p className="mt-2 text-sm text-gray-600">
          or drag and drop files here
        </p>
        
        <p className="text-xs text-gray-400 mt-1">
          Accepted formats: JPG, PNG, PDF, DOC, XLS (Max 10MB)
        </p>
      </div>

      {/* 已上传文件列表 */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border border-gray-300 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-base">📄</span>
                  <div>
                    <span className="font-medium text-sm">{file.name}</span>
                    <span className="text-xs text-gray-600 ml-2">({formatFileSize(file.size)})</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}