'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ExpenseAnalysisResult } from './types'
import ExpenseDetailsFields, { ExpenseCurrencyOption, ExpenseItemTypeOption } from './ExpenseDetailsFields'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, X, Paperclip } from 'lucide-react'

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

  // 同步最新的分析结果到可编辑状态，并补全缺失的汇率/SGD金额
  useEffect(() => {
    if (!analysisResult) {
      setEditableData({})
      setEditableDate(null)
      return
    }

    const nextData: ExpenseAnalysisResult = { ...analysisResult }

    const matchedRate = nextData.currency ? exchangeRates[nextData.currency] : undefined
    const hasAmount = typeof nextData.amount === 'string' && nextData.amount.trim() !== ''

    const rateFromExchange = typeof matchedRate === 'number' ? matchedRate.toFixed(4) : undefined

    if (hasAmount) {
      const rawRate = nextData.forexRate?.toString().trim()
      if (!rawRate || rawRate === 'null' || rawRate === 'undefined') {
        if (rateFromExchange) {
          nextData.forexRate = rateFromExchange
        }
      }

      const rawSgdAmount = nextData.sgdAmount?.toString().trim()
      const finalRate = nextData.forexRate || rateFromExchange

      if ((!rawSgdAmount || rawSgdAmount === 'null' || rawSgdAmount === 'undefined') && finalRate) {
        nextData.sgdAmount = calculateSgdAmount(nextData.amount, finalRate)
      }
    }

    setEditableData(nextData)
    setEditableDate(parseDateString(nextData.date))
  }, [analysisResult, exchangeRates])

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
    setEditableData(prev => {
      const nextRate = prev.forexRate || ''
      const derivedSgd = nextRate ? calculateSgdAmount(value, nextRate) : ''

      return {
        ...prev,
        amount: value,
        sgdAmount: derivedSgd
      }
    })
  }

  const handleForexRateChange = (value: string) => {
    setEditableData(prev => {
      const amount = prev.amount || ''
      const derivedSgd = amount ? calculateSgdAmount(amount, value) : ''

      return {
        ...prev,
        forexRate: value,
        sgdAmount: derivedSgd
      }
    })
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
      <DialogContent
        className="overflow-y-auto py-4"
        style={{
          maxWidth: '95vw',
          maxHeight: '85vh',
          width: '64rem'
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
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
          <Card className="mb-3">
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 sm:py-2">
              <div className="flex items-start gap-3 text-sm text-gray-700">
                <div className="mt-1">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 leading-tight">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">
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

        <div className="space-y-3">
          {/* 分析结果/错误信息 */}
            {isError ? (
              <Card>
                <CardHeader className="pb-2">
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
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Extracted Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ExpenseDetailsFields
                    mode='edit'
                    date={editableDate}
                    dateDisplay={editableData.date || null}
                    onDateChange={handleDateChange}
                    itemNo={editableData.itemNo}
                    onItemNoChange={handleItemNoChange}
                    itemTypes={itemTypes}
                    currency={editableData.currency}
                    onCurrencyChange={handleCurrencyChange}
                    currencies={currencies}
                    amount={editableData.amount}
                    onAmountChange={handleAmountChange}
                    forexRate={editableData.forexRate}
                    onForexRateChange={handleForexRateChange}
                    sgdAmount={editableData.sgdAmount}
                    onSgdAmountChange={handleSgdAmountChange}
                    details={editableData.details}
                    onDetailsChange={handleDetailsChange}
                  />

                  {/* 提示信息 */}
                  <div className="rounded border-primary bg-primary p-2">
                    <p className="text-xs text-white font-semibold">
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
