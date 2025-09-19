'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ExpenseAnalysisResult } from './types'
import ExpenseDetailsFields, { ExpenseCurrencyOption, ExpenseItemTypeOption } from './ExpenseDetailsFields'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, X, Edit3, Paperclip } from 'lucide-react'

interface AIAnalysisDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: ExpenseAnalysisResult) => void
  onReject: () => void
  analysisResult: ExpenseAnalysisResult | null
  uploadedFile: File | null
  isError?: boolean
  errorMessage?: string
  itemTypes?: ExpenseItemTypeOption[]
  currencies?: ExpenseCurrencyOption[]
  exchangeRates?: Record<string, number>
}

export default function AIAnalysisDialog({
  isOpen,
  onClose,
  onConfirm,
  onReject,
  analysisResult,
  uploadedFile,
  isError = false,
  errorMessage,
  itemTypes = [],
  currencies = [],
  exchangeRates = {}
}: AIAnalysisDialogProps) {
  const [editableData, setEditableData] = useState<ExpenseAnalysisResult>(analysisResult || {})
  const [isEditing, setIsEditing] = useState(false)
  const [editableDate, setEditableDate] = useState<Date | null>(null)

  const parseDateString = (value?: string | null) => {
    if (!value) return null
    const parts = value.split('/')
    if (parts.length < 2) return null
    const [month, day, maybeYear] = parts
    const year = maybeYear ? parseInt(maybeYear, 10) : new Date().getFullYear()
    const monthIndex = parseInt(month, 10) - 1
    const dayNumber = parseInt(day, 10)
    if (Number.isNaN(monthIndex) || Number.isNaN(dayNumber)) return null
    return new Date(year, monthIndex, dayNumber)
  }

  const formatDateForData = (date: Date | null) => {
    if (!date) return ''
    return format(date, 'MM/dd')
  }

  const calculateSgdAmount = (amount: string | undefined, rate: string | undefined) => {
    const parsedAmount = parseFloat(amount || '') || 0
    const parsedRate = parseFloat(rate || '') || 0
    return parsedAmount === 0 || parsedRate === 0
      ? '0.00'
      : (parsedAmount * parsedRate).toFixed(2)
  }

  const calculateForexRate = (sgdAmount: string | undefined, amount: string | undefined) => {
    const parsedSgd = parseFloat(sgdAmount || '') || 0
    const parsedAmount = parseFloat(amount || '') || 0
    if (parsedAmount === 0) return '0.0000'
    return (parsedSgd / parsedAmount).toFixed(4)
  }

  // 同步最新的分析结果到可编辑状态
  useEffect(() => {
    setEditableData(analysisResult || {})
    setEditableDate(parseDateString(analysisResult?.date))
    setIsEditing(false)
  }, [analysisResult])

  const handleConfirm = () => {
    onConfirm(editableData)
    onClose()
  }

  const handleReject = () => {
    onReject()
    onClose()
  }

  const handleDateChange = (date: Date | null) => {
    setEditableDate(date)
    setEditableData(prev => ({
      ...prev,
      date: formatDateForData(date)
    }))
  }

  const handleItemNoChange = (value: string) => {
    setEditableData(prev => ({
      ...prev,
      itemNo: value
    }))
  }

  const handleCurrencyChange = (value: string) => {
    setEditableData(prev => {
      const next: ExpenseAnalysisResult = {
        ...prev,
        currency: value
      }

      const matchedRate = exchangeRates[value]
      if (typeof matchedRate === 'number') {
        const formattedRate = matchedRate.toFixed(4)
        next.forexRate = formattedRate
        if (prev.amount) {
          next.sgdAmount = calculateSgdAmount(prev.amount, formattedRate)
        }
      }

      return next
    })
  }

  const handleAmountChange = (value: string) => {
    setEditableData(prev => ({
      ...prev,
      amount: value,
      sgdAmount: calculateSgdAmount(value, prev.forexRate)
    }))
  }

  const handleForexRateChange = (value: string) => {
    setEditableData(prev => ({
      ...prev,
      forexRate: value,
      sgdAmount: calculateSgdAmount(prev.amount, value)
    }))
  }

  const handleSgdAmountChange = (value: string) => {
    setEditableData(prev => ({
      ...prev,
      sgdAmount: value,
      forexRate: calculateForexRate(value, prev.amount)
    }))
  }

  const handleDetailsChange = (value: string) => {
    setEditableData(prev => ({
      ...prev,
      details: value
    }))
  }

  const filePreviewUrl = useMemo(() => {
    if (!uploadedFile) return null
    return URL.createObjectURL(uploadedFile)
  }, [uploadedFile])

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl)
      }
    }
  }, [filePreviewUrl])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isError ? (
              <>
                <X className="h-5 w-5 text-red-500" />
                AI Analysis Failed
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                AI Analysis Result
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {uploadedFile && (
          <Card className="mb-4">
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
              <div className="flex items-start gap-3 text-sm text-gray-700">
                <div className="mt-1">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB · {uploadedFile.type || 'Unknown type'}
                  </p>
                </div>
              </div>
              {filePreviewUrl && (
                <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
                  <a href={filePreviewUrl} target="_blank" rel="noopener noreferrer">
                    Open Preview
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {/* 分析结果/错误信息 */}
            {isError ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-red-600">Analysis Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {errorMessage || "Unable to analyze the uploaded file. Please fill in the form manually."}
                  </p>
                  <p className="text-xs text-gray-500">
                    This might happen if the image quality is poor, text is not clear, or the document format is not recognized.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Extracted Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    {isEditing ? 'View' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ExpenseDetailsFields
                    mode={isEditing ? 'edit' : 'display'}
                    date={editableDate}
                    dateDisplay={editableData.date || null}
                    onDateChange={isEditing ? handleDateChange : undefined}
                    itemNo={editableData.itemNo}
                    onItemNoChange={isEditing ? handleItemNoChange : undefined}
                    itemTypes={itemTypes}
                    currency={editableData.currency}
                    onCurrencyChange={isEditing ? handleCurrencyChange : undefined}
                    currencies={currencies}
                    amount={editableData.amount}
                    onAmountChange={isEditing ? handleAmountChange : undefined}
                    forexRate={editableData.forexRate}
                    onForexRateChange={isEditing ? handleForexRateChange : undefined}
                    sgdAmount={editableData.sgdAmount}
                    onSgdAmountChange={isEditing ? handleSgdAmountChange : undefined}
                    details={editableData.details}
                    onDetailsChange={isEditing ? handleDetailsChange : undefined}
                  />

                  {/* 提示信息 */}
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-700">
                      💡 Exchange rate and SGD amount will be calculated automatically based on the currency.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReject}>
            {isError ? 'Close' : 'Don\'t Use AI'}
          </Button>
          {!isError && (
            <Button onClick={handleConfirm} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Use This Data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
