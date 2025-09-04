'use client'

import { useState, useRef } from 'react'

interface ItemFileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export default function ItemFileUpload({ files, onFilesChange }: ItemFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      onFilesChange([...files, ...newFiles])
      // 清空input，允许再次选择同样的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    onFilesChange(updatedFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div>
      <label className="block text-xs font-semibold mb-1">Supporting Documents</label>
      
      {/* 文件选择按钮 */}
      <div className="mb-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          id="item-file-upload"
        />
        <label
          htmlFor="item-file-upload"
          className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 text-sm bg-white hover:bg-gray-50"
        >
          <span className="mr-1">📎</span>
          Add Files
        </label>
      </div>

      {/* 已选择的文件列表 */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 border">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span>📄</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}