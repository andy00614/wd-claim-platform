'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ItemFileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export default function ItemFileUpload({ files, onFilesChange }: ItemFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [lastRemoved, setLastRemoved] = useState<{ file: File, index: number } | null>(null)
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalSizeText = useMemo(() => {
    const total = files.reduce((s, f) => s + (f.size || 0), 0)
    return formatFileSize(total)
  }, [files])

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles)

    // limits
    const MAX_PER_FILE = 10 * 1024 * 1024 // 10MB
    const MAX_COUNT = 10

    // dedupe by name+size+lastModified
    const signature = (f: File) => `${f.name}-${f.size}-${(f as any).lastModified}`
    const existing = new Set(files.map(signature))

    const filtered = filesArray.filter(f => {
      if (f.size > MAX_PER_FILE) {
        toast.error(`${f.name} 超过 10MB，已忽略`)
        return false
      }
      if (existing.has(signature(f))) {
        // 跳过重复
        return false
      }
      return true
    })

    const merged = [...files, ...filtered].slice(0, MAX_COUNT)
    if (merged.length < files.length + filtered.length) {
      toast.error(`最多仅可选择 ${MAX_COUNT} 个文件`)
    }
    onFilesChange(merged)
    // 清空input，允许再次选择同样的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [files, onFilesChange])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeFile = (index: number) => {
    const removed = files[index]
    const updatedFiles = files.filter((_, i) => i !== index)
    onFilesChange(updatedFiles)
    setLastRemoved({ file: removed, index })
    const t = toast(
      `${removed.name} 已移除`,
      {
        action: {
          label: '撤销',
          onClick: () => {
            const restored = [...updatedFiles]
            restored.splice(index, 0, removed)
            onFilesChange(restored)
            setLastRemoved(null)
          }
        },
        duration: 4000
      }
    )
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Supporting Documents</Label>
      
      {/* 拖拽上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors",
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-gray-300 hover:border-gray-400"
        )}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload supporting documents"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
        }}
        onPaste={(e) => {
          const items = e.clipboardData?.files
          if (items && items.length > 0) handleFiles(items)
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex items-center justify-center gap-2">
          <Upload className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            Drag files or click to select
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Images or PDF • {files.length} files • {totalSizeText}</p>
      </div>

      {/* 已选择的文件列表 */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((file, index) => {
            const isImage = file.type.startsWith('image/')
            const url = isImage ? URL.createObjectURL(file) : null
            return (
              <Card key={index} className="p-2 group">
                <div className="flex items-center gap-2">
                  {isImage ? (
                    // 预览缩略图
                    <img
                      src={url as string}
                      alt={file.name}
                      className="h-12 w-12 object-cover rounded border"
                      onClick={() => window.open(url as string, '_blank')}
                    />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-xs" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-[10px] text-gray-500">{formatFileSize(file.size)}</div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeFile(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 h-7 w-7 p-0"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
