'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExpenseAnalysisResult, AnalysisApiResponse } from './types'
import AIAnalysisDialog from './AIAnalysisDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Brain,
  Loader2,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  FileText,
  Paperclip
} from 'lucide-react'
import { toast } from 'sonner'

const MAX_ATTACHMENT_COUNT_SINGLE = 1
const MAX_ATTACHMENT_COUNT_BATCH = 20
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

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

export interface BatchAnalysisResult {
  file: File
  data: ExpenseAnalysisResult | null
  error?: string
}

interface SmartFileUploadProps {
  mode?: 'single' | 'batch'
  files: File[]
  onFilesChange: (files: File[]) => void
  onAIDataExtracted?: (data: ExpenseAnalysisResult) => void
  onBatchAnalysisComplete?: (results: BatchAnalysisResult[]) => void
  itemTypes?: ItemTypeOption[]
  currencies?: CurrencyOption[]
  exchangeRates?: Record<string, number>
}

export default function SmartFileUpload({
  mode = 'single',
  files,
  onFilesChange,
  onAIDataExtracted,
  onBatchAnalysisComplete,
  itemTypes = [],
  currencies = [],
  exchangeRates = {}
}: SmartFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentCount = files.length
  const maxAttachmentCount = mode === 'batch' ? MAX_ATTACHMENT_COUNT_BATCH : MAX_ATTACHMENT_COUNT_SINGLE

// AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ExpenseAnalysisResult | null>(null)
  const [currentAnalyzingFile, setCurrentAnalyzingFile] = useState<File | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Batch analysis state
  const [analyzingProgress, setAnalyzingProgress] = useState({ current: 0, total: 0 })
  const [batchResults, setBatchResults] = useState<BatchAnalysisResult[]>([])

  const previewUrls = useMemo(() => (
    files.map(file => {
      const isPreviewable = file.type.startsWith('image/') || file.type === 'application/pdf'
      return isPreviewable ? URL.createObjectURL(file) : null
    })
  ), [files])

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [previewUrls])

  const analyzeFile = useCallback(async (file: File) => {
    setIsAnalyzing(true)
    setCurrentAnalyzingFile(file)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
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
        toast.success('AI analysis complete!')
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
  }, [])

  const analyzeSingleFile = useCallback(async (file: File): Promise<BatchAnalysisResult> => {
    try {
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
        return { file, data: data.data }
      } else {
        throw new Error('No analysis data received')
      }

    } catch (error) {
      console.error('AI analysis error for file:', file.name, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return { file, data: null, error: errorMessage }
    }
  }, [])

  const analyzeBatchFiles = useCallback(async (filesToAnalyze: File[]) => {
    setIsAnalyzing(true)
    setAnalyzingProgress({ current: 0, total: filesToAnalyze.length })
    setBatchResults([])

    try {
      toast.info(`Starting AI analysis for ${filesToAnalyze.length} files...`)

      // Parallel analysis
      const promises = filesToAnalyze.map(async (file, index) => {
        const result = await analyzeSingleFile(file)
        setAnalyzingProgress(prev => ({ ...prev, current: prev.current + 1 }))
        return result
      })

      const results = await Promise.all(promises)
      setBatchResults(results)

      const successCount = results.filter(r => r.data !== null).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast.success(`AI analysis complete! ${successCount} succeeded, ${failCount} failed.`)
      } else {
        toast.error(`All ${failCount} analyses failed.`)
      }

      if (onBatchAnalysisComplete) {
        onBatchAnalysisComplete(results)
      }

    } catch (error) {
      console.error('Batch analysis error:', error)
      toast.error('Batch analysis failed')
    } finally {
      setIsAnalyzing(false)
      setAnalyzingProgress({ current: 0, total: 0 })
    }
  }, [analyzeSingleFile, onBatchAnalysisComplete])

  const addFiles = useCallback(async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const maxSize = MAX_FILE_SIZE
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'

      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds the 2MB limit. Please compress and upload again.`)
        return false
      }

      if (!isImage && !isPdf) {
        toast.error(`File type "${file.type || 'unknown'}" is not supported. Please upload an image or PDF.`)
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    if (mode === 'single') {
      // Single mode: only allow one file, replace existing
      const nextFile = validFiles[0]
      const hasExisting = attachmentCount >= maxAttachmentCount

      if (hasExisting) {
        toast.info('Only one attachment is allowed. The previous file has been replaced.')
      }

      onFilesChange([nextFile])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (nextFile.type.startsWith('image/') || nextFile.type === 'application/pdf') {
        await analyzeFile(nextFile)
      }
    } else {
      // Batch mode: allow multiple files up to max
      const remainingSlots = maxAttachmentCount - attachmentCount
      const filesToAdd = validFiles.slice(0, remainingSlots)

      if (validFiles.length > remainingSlots) {
        toast.warning(`Only ${remainingSlots} slots available. ${validFiles.length - remainingSlots} files were not added.`)
      }

      if (filesToAdd.length === 0) {
        toast.error(`Maximum of ${maxAttachmentCount} files allowed.`)
        return
      }

      const analyzableFiles = filesToAdd.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')

      // 根据本次上传的文件数量决定处理方式
      if (filesToAdd.length === 1) {
        // 单个文件上传：替换现有文件，显示分析弹窗
        onFilesChange([filesToAdd[0]])

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        if (analyzableFiles.length > 0) {
          await analyzeFile(analyzableFiles[0])
        }
      } else {
        // 多个文件上传：批量分析并自动创建 items
        const updatedFiles = [...files, ...filesToAdd]
        onFilesChange(updatedFiles)

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Start batch analysis for all added files
        if (analyzableFiles.length > 0) {
          await analyzeBatchFiles(analyzableFiles)
        }
      }
    }
  }, [mode, analyzeFile, analyzeBatchFiles, attachmentCount, maxAttachmentCount, files, onFilesChange])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    void addFiles(selectedFiles)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault()
    const droppedFiles = Array.from(event.dataTransfer.files)
    void addFiles(droppedFiles)
  }, [addFiles])

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault()
  }

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items ?? [])
      const pastedFiles = items
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => Boolean(file))

      if (pastedFiles.length === 0) return

      event.preventDefault()
      void addFiles(pastedFiles)
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [addFiles])

  const handleAnalysisConfirm = (data: ExpenseAnalysisResult) => {
    if (onAIDataExtracted) {
      onAIDataExtracted(data)
    }
    setShowAnalysisDialog(false)
    toast.success('Applied the AI result to the form.')
  }

  const handleAnalysisReject = () => {
    setShowAnalysisDialog(false)
    toast.info('AI result dismissed.')
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 bytes'
    const k = 1024
    const sizes = ['bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <>
      <div
        className="rounded-xl border border-muted-foreground/20 bg-muted/10 p-4 space-y-4"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
            <Brain className="h-4 w-4 text-primary" />
            Smart Upload {mode === 'batch' && `(${files.length}/${maxAttachmentCount})`}
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === 'batch'
              ? `Drag, paste, or browse receipts (up to ${maxAttachmentCount}). AI will extract details from each file.`
              : 'Drag, paste, or browse a receipt. AI will extract the key details (one attachment per item).'}
          </p>
        </div>

        {/* Analysis status */}
        {isAnalyzing && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="flex-1 min-w-[160px]">
                {mode === 'batch' && analyzingProgress.total > 0 ? (
                  <>
                    <p className="font-medium text-primary">
                      Analyzing batch: {analyzingProgress.current}/{analyzingProgress.total} files
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="h-2 w-full rounded bg-primary/10">
                        <div
                          className="h-2 rounded bg-primary/50 transition-all duration-300"
                          style={{ width: `${(analyzingProgress.current / analyzingProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-primary truncate">
                      Analyzing {currentAnalyzingFile?.name}
                    </p>
                    <div className="mt-1 space-y-1">
                      <Skeleton className="h-2 w-full rounded bg-primary/20" />
                      <Skeleton className="h-2 w-2/3 rounded bg-primary/10" />
                    </div>
                  </>
                )}
              </div>
              <span className="text-xs text-primary/80 whitespace-nowrap">Please hold on…</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple={mode === 'batch'}
          onChange={handleFileSelect}
          className="hidden"
        />

        {files.length === 0 && (
          <div className="relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/40 bg-background/80 p-4 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="flex items-center gap-3">
              <UploadCloud className="h-9 w-9 rounded-full border border-primary/40 p-2 text-primary" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {mode === 'batch' ? 'Drag or paste receipts here' : 'Drag or paste a receipt here'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports JPG / PNG / HEIC / PDF (≤2MB){mode === 'batch' && `, up to ${maxAttachmentCount} files`}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 sm:items-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                {mode === 'batch' ? 'Choose Files' : 'Choose File'}
              </Button>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Camera className="h-3.5 w-3.5 text-primary" />
                <span>AI analysis runs automatically</span>
              </div>
            </div>
          </div>
        )}

        {/* Attached file list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {mode === 'batch' ? `Attached Files (${files.length})` : 'Attached File'}
            </p>
            <div className="flex flex-col gap-2">
              {files.map((file, index) => {
                const isAnalyzable = file.type.startsWith('image/') || file.type === 'application/pdf'
                const isCurrentlyAnalyzing = isAnalyzing && currentAnalyzingFile?.name === file.name

                return (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-[160px] flex-1">
                      <span className="text-primary">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : file.type === 'application/pdf' ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                      {isAnalyzable && (
                        <Brain className="h-3.5 w-3.5 text-primary" />
                      )}
                      {isCurrentlyAnalyzing && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {previewUrls[index] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          asChild
                        >
                          <a href={previewUrls[index] ?? undefined} target="_blank" rel="noopener noreferrer">
                            Preview
                          </a>
                        </Button>
                      )}
                      {isAnalyzable && !isCurrentlyAnalyzing && mode === 'single' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => analyzeFile(file)}
                          disabled={isAnalyzing}
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          <Brain className="h-3 w-3" />
                          Analyze
                        </Button>
                      )}
                      {mode === 'single' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isAnalyzing}
                          className="h-7 px-2 text-xs"
                        >
                          Replace
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isAnalyzing}
                        className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            {mode === 'batch' && files.length < maxAttachmentCount && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  You can add {maxAttachmentCount - files.length} more file{maxAttachmentCount - files.length !== 1 ? 's' : ''}.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="gap-2 h-7"
                >
                  <Paperclip className="h-3 w-3" />
                  Add More
                </Button>
              </div>
            )}
            {mode === 'single' && (
              <p className="text-xs text-muted-foreground">
                Drag, paste, or choose a new file to replace the current attachment.
              </p>
            )}
          </div>
        )}
      </div>

      {/* AI analysis dialog */}
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
