'use client'

import { useRef, useState } from 'react'
import { ExpenseAnalysisResult, AnalysisApiResponse } from './types'
import AIAnalysisDialog from './AIAnalysisDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ItemTypeOption {
  id: number
  name: string
  no: string
}

interface CurrencyOption {
  id: number
  name: string
  code: string
}

interface SmartFileUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  onAIDataExtracted?: (data: ExpenseAnalysisResult) => void
  itemTypes?: ItemTypeOption[]
  currencies?: CurrencyOption[]
  exchangeRates?: Record<string, number>
}

export default function SmartFileUpload({
  files,
  onFilesChange,
  onAIDataExtracted,
  itemTypes = [],
  currencies = [],
  exchangeRates = {}
}: SmartFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI分析相关状态
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ExpenseAnalysisResult | null>(null)
  const [currentAnalyzingFile, setCurrentAnalyzingFile] = useState<File | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

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

  const addFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]

      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is too large. Max size is 10MB`)
        return false
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File format "${file.type}" is not supported`)
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    // 添加文件到列表
    onFilesChange([...files, ...validFiles])

    // 自动分析第一个支持AI分析的文件
    const analyzableFile = validFiles.find(file =>
      file.type.startsWith('image/') || file.type === 'application/pdf'
    )

    if (analyzableFile) {
      await analyzeFile(analyzableFile)
    }
  }

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true)
    setCurrentAnalyzingFile(file)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
      // 将文件转换为base64
      const base64 = await fileToBase64(file)

      const response = await fetch('/api/ai/analyze-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64 }),
      })

      const data: AnalysisApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      if (data.success && data.data) {
        setAnalysisResult(data.data)
        setShowAnalysisDialog(true)
        toast.success('AI analysis completed!')
      } else {
        throw new Error('No analysis data received')
      }

    } catch (error) {
      console.error('AI analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setAnalysisError(errorMessage)
      setShowAnalysisDialog(true)
      toast.error('AI analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // 返回完整的data URL格式，包含MIME类型
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleAnalysisConfirm = (data: ExpenseAnalysisResult) => {
    if (onAIDataExtracted) {
      onAIDataExtracted(data)
    }
    setShowAnalysisDialog(false)
    toast.success('Data applied to form!')
  }

  const handleAnalysisReject = () => {
    setShowAnalysisDialog(false)
    toast.info('AI analysis rejected')
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
    <>
      <div className="bg-white border border-gray-300 p-4 mb-6">
        <h3 className="text-md font-semibold mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" />
          Smart File Upload with AI Analysis
        </h3>

        {/* 分析状态显示 */}
        {isAnalyzing && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Analyzing {currentAnalyzingFile?.name}...</span>
            </div>
            <div className="mt-2 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        )}

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

          <Brain className="h-8 w-8 text-blue-600 mx-auto mb-3" />

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            Choose Files
          </Button>

          <p className="mt-2 text-sm text-gray-600">
            or drag and drop files here
          </p>

          <p className="text-xs text-gray-400 mt-1">
            📷 Images & PDFs will be automatically analyzed by AI
          </p>

          <p className="text-xs text-gray-400">
            Accepted formats: JPG, PNG, PDF, DOC, XLS (Max 10MB)
          </p>
        </div>

        {/* 已上传文件列表 */}
        {files.length > 0 && (
          <div className="mt-4">
            <div className="space-y-2">
              {files.map((file, index) => {
                const isAnalyzable = file.type.startsWith('image/') || file.type === 'application/pdf'
                const isCurrentlyAnalyzing = isAnalyzing && currentAnalyzingFile?.name === file.name

                return (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-base">
                        {file.type.startsWith('image/') ? '🖼️' :
                         file.type === 'application/pdf' ? '📄' : '📎'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{file.name}</span>
                          {isAnalyzable && (
                            <Brain className="h-3 w-3 text-blue-600" title="AI Analyzable" />
                          )}
                          {isCurrentlyAnalyzing && (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600">
                          {formatFileSize(file.size)} • {file.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAnalyzable && !isCurrentlyAnalyzing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => analyzeFile(file)}
                          disabled={isAnalyzing}
                          className="gap-1 text-xs"
                        >
                          <Brain className="h-3 w-3" />
                          Analyze
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isAnalyzing}
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI分析结果对话框 */}
      <AIAnalysisDialog
        isOpen={showAnalysisDialog}
        onClose={() => setShowAnalysisDialog(false)}
        onConfirm={handleAnalysisConfirm}
        onReject={handleAnalysisReject}
        analysisResult={analysisResult}
        uploadedFile={currentAnalyzingFile}
        isError={!!analysisError}
        errorMessage={analysisError || undefined}
        itemTypes={itemTypes}
        currencies={currencies}
        exchangeRates={exchangeRates}
      />
    </>
  )
}
