'use client'

import { format } from 'date-fns'
import { PlusCircle, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from "sonner"
import ExpenseDetailsFields from './ExpenseDetailsFields'
import SmartFileUpload, { type BatchAnalysisResult } from './SmartFileUpload'
import type { ExpenseItem } from '../page'
import type { ExpenseAnalysisResult } from './types'

interface ItemType {
  id: number
  name: string
  no: string
}

interface Currency {
  id: number
  name: string
  code: string
}

interface ExpenseFormProps {
  itemTypes: ItemType[]
  currencies: Currency[]
  exchangeRates: Record<string, number>
  onAddItem: (item: Omit<ExpenseItem, 'id'>) => void
}

export default function ExpenseForm({ itemTypes, currencies, exchangeRates, onAddItem }: ExpenseFormProps) {
  const [date, setDate] = useState<Date>(new Date(2024, 11, 25)) // 默认日期
  const [formData, setFormData] = useState({
    itemNo: 'C2',
    details: 'Meeting with KPMG - Taxi from office to Suntec tower one - (Comfort Delgro)',
    currency: 'SGD',
    amount: '45.80',
    forexRate: '1.0000',
    sgdAmount: '45.80'
  })

  const [attachments, setAttachments] = useState<File[]>([])
  const [hasValidationError, setHasValidationError] = useState(false)

  const isFormValid = useMemo(() => {
    const hasValidDate = date instanceof Date && !Number.isNaN(date.getTime())

    const trimmedItemNo = formData.itemNo?.trim() ?? ''
    const trimmedCurrency = formData.currency?.trim() ?? ''
    const trimmedAmount = formData.amount?.trim() ?? ''
    const trimmedRate = formData.forexRate?.trim() ?? ''
    const trimmedSgdAmount = formData.sgdAmount?.trim() ?? ''

    if (!hasValidDate) return false
    if (!trimmedItemNo || !trimmedCurrency || !trimmedAmount || !trimmedRate || !trimmedSgdAmount) {
      return false
    }

    const numericFields = [trimmedAmount, trimmedRate, trimmedSgdAmount]
    const hasValidNumbers = numericFields.every((value) => !Number.isNaN(Number.parseFloat(value)))

    return hasValidNumbers && !hasValidationError
  }, [date, formData, hasValidationError])

  // 计算SGD金额
  const calculateSgdAmount = (amount: string, rate: string) => {
    const numAmount = parseFloat(amount) || 0
    const numRate = parseFloat(rate) || 0
    return (numAmount * numRate).toFixed(2)
  }

  // 计算汇率 (SGD Amount / Amount)
  const calculateForexRate = (sgdAmount: string, amount: string) => {
    const numSgdAmount = parseFloat(sgdAmount) || 0
    const numAmount = parseFloat(amount) || 0
    if (numAmount === 0) return '0.0000'
    return (numSgdAmount / numAmount).toFixed(4)
  }

  // 当金额改变时，自动计算 SGD 金额
  const handleAmountChange = (amount: string) => {
    const sgdAmount = calculateSgdAmount(amount, formData.forexRate)
    setFormData(prev => ({
      ...prev,
      amount,
      sgdAmount
    }))
  }

  // 当汇率改变时，自动计算 SGD 金额
  const handleForexRateChange = (rate: string) => {
    const sgdAmount = calculateSgdAmount(formData.amount, rate)
    setFormData(prev => ({
      ...prev,
      forexRate: rate,
      sgdAmount
    }))
  }

  // 当SGD金额改变时，自动计算汇率
  const handleSgdAmountChange = (sgdAmount: string) => {
    const forexRate = calculateForexRate(sgdAmount, formData.amount)
    setFormData(prev => ({
      ...prev,
      sgdAmount,
      forexRate
    }))
  }

  // 当货币改变时，更新汇率并重新计算
  const handleCurrencyChange = (currency: string) => {
    const newRate = (exchangeRates[currency] || 1.0000).toFixed(4)
    const sgdAmount = calculateSgdAmount(formData.amount, newRate)
    setFormData(prev => ({
      ...prev,
      currency,
      forexRate: newRate,
      sgdAmount
    }))
  }

  // 智能日期解析函数 - 支持 MM/dd/yyyy 和 MM/dd 格式
  const parseSmartDate = (dateStr: string): Date | null => {
    try {
      const parts = dateStr.split('/')
      if (parts.length < 2) return null

      const month = Number.parseInt(parts[0], 10)
      const day = Number.parseInt(parts[1], 10)

      if (Number.isNaN(month) || Number.isNaN(day)) return null
      if (month < 1 || month > 12 || day < 1 || day > 31) return null

      // 如果有年份，直接使用
      if (parts.length === 3 && parts[2]) {
        const year = Number.parseInt(parts[2], 10)
        if (!Number.isNaN(year)) {
          return new Date(year, month - 1, day)
        }
      }

      // 只有 MM/dd 格式，需要智能推断年份
      const today = new Date()
      const currentYear = today.getFullYear()

      // 先尝试当前年份
      let candidateDate = new Date(currentYear, month - 1, day)

      // 如果日期在未来超过30天，可能是去年的
      const daysDiff = (candidateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 30) {
        candidateDate = new Date(currentYear - 1, month - 1, day)
      }
      // 如果日期在过去超过335天（约11个月），可能是明年的
      else if (daysDiff < -335) {
        candidateDate = new Date(currentYear + 1, month - 1, day)
      }

      return candidateDate
    } catch (_error) {
      console.warn('Failed to parse date:', dateStr, _error)
      return null
    }
  }

  // 处理单个文件的AI分析结果 - 显示弹窗让用户确认
  const handleAIDataExtracted = (aiData: ExpenseAnalysisResult) => {
    console.log('AI data received:', aiData)

    // 创建新的表单数据，优先使用AI数据
    const newFormData = { ...formData }
    let newDate = date

    // 日期：优先使用AI识别的结果
    if (aiData.date) {
      const parsedDate = parseSmartDate(aiData.date)
      if (parsedDate) {
        newDate = parsedDate
        setDate(newDate)
      }
    }

    // 其他字段：优先使用AI数据，如果AI数据为空则保留原值
    if (aiData.itemNo) {
      newFormData.itemNo = aiData.itemNo
    }

    if (aiData.details) {
      newFormData.details = aiData.details
    }

    if (aiData.currency) {
      newFormData.currency = aiData.currency
    }

    if (aiData.amount) {
      newFormData.amount = aiData.amount
    }

    // 汇率处理逻辑：
    // 1. 如果有货币信息，从 exchangeRates 查找正确的汇率
    // 2. 只有在查找失败时才使用 AI 提供的汇率（如果有）
    if (aiData.currency && aiData.amount) {
      // 从 exchangeRates 查找汇率
      const currencyRate = exchangeRates[aiData.currency]
      const newRate = (typeof currencyRate === 'number' ? currencyRate : 1.0000).toFixed(4)
      const sgdAmount = calculateSgdAmount(aiData.amount, newRate)

      newFormData.forexRate = newRate
      newFormData.sgdAmount = sgdAmount
    } else if (aiData.forexRate && aiData.sgdAmount) {
      // 如果没有货币信息但 AI 提供了汇率和 SGD 金额，才使用 AI 的数据
      newFormData.forexRate = aiData.forexRate
      newFormData.sgdAmount = aiData.sgdAmount
    }

    setFormData(newFormData)
  }

  // 处理批量分析结果 - 自动为每个文件创建一个expense item
  const handleBatchAnalysisComplete = (results: BatchAnalysisResult[]) => {
    console.log('Batch analysis complete:', results)

    let successCount = 0
    let failCount = 0

    results.forEach((result) => {
      if (result.data) {
        const aiData = result.data
        const itemDate = aiData.date ? parseSmartDate(aiData.date) : new Date()

        // 计算汇率和SGD金额
        // 优先从 exchangeRates 查找汇率，确保使用正确的汇率
        let forexRate = '1.0000'
        let sgdAmount = '0.00'

        if (aiData.currency) {
          // 从 exchangeRates 查找汇率
          const currencyRate = exchangeRates[aiData.currency]
          forexRate = (typeof currencyRate === 'number' ? currencyRate : 1.0000).toFixed(4)
        } else if (aiData.forexRate) {
          // 只有在没有货币信息时才使用 AI 提供的汇率
          forexRate = aiData.forexRate
        }

        if (aiData.amount) {
          sgdAmount = calculateSgdAmount(aiData.amount, forexRate)
        } else if (aiData.sgdAmount) {
          // 只有在没有金额时才使用 AI 提供的 SGD 金额
          sgdAmount = aiData.sgdAmount
        }

        // 创建新的expense item
        const newItem: Omit<ExpenseItem, 'id'> = {
          date: itemDate ? format(itemDate, 'MM/dd') : format(new Date(), 'MM/dd'),
          itemNo: aiData.itemNo || 'C2',
          details: aiData.details || '',
          currency: aiData.currency || 'SGD',
          amount: parseFloat(aiData.amount || '0'),
          rate: parseFloat(forexRate),
          sgdAmount: parseFloat(sgdAmount),
          attachments: [result.file],
          existingAttachments: []
        }

        onAddItem(newItem)
        successCount++
      } else {
        failCount++
      }
    })

    if (successCount > 0) {
      toast.success(`${successCount} expense item${successCount > 1 ? 's' : ''} created successfully!`)
    }

    if (failCount > 0) {
      toast.warning(`${failCount} file${failCount > 1 ? 's' : ''} could not be analyzed.`)
    }

    // 清空上传区域
    setAttachments([])
  }

  const handleAddItem = () => {
    if (!isFormValid) {
      toast.error('请填写所有必填字段')
      return
    }

    const item = {
      date: format(date, 'MM/dd'),
      itemNo: formData.itemNo,
      details: formData.details,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      rate: parseFloat(formData.forexRate),
      sgdAmount: parseFloat(formData.sgdAmount),
      attachments: [...attachments],
      existingAttachments: []
    }

    onAddItem(item)

    // 清空表单
    setDate(new Date())
    setFormData({
      itemNo: '',
      details: '',
      currency: 'SGD',
      amount: '',
      forexRate: '1.0000',
      sgdAmount: ''
    })
    setAttachments([])
  }


  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-md">Expense Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* 第一行：日期、项目类型 */}
        <ExpenseDetailsFields
          mode="edit"
          date={date}
          onDateChange={(nextDate) => nextDate && setDate(nextDate)}
          itemNo={formData.itemNo}
          onItemNoChange={(value) => setFormData(prev => ({ ...prev, itemNo: value }))}
          itemTypes={itemTypes}
          currency={formData.currency}
          onCurrencyChange={handleCurrencyChange}
          currencies={currencies}
          amount={formData.amount}
          onAmountChange={handleAmountChange}
          forexRate={formData.forexRate}
          onForexRateChange={handleForexRateChange}
          sgdAmount={formData.sgdAmount}
          onSgdAmountChange={handleSgdAmountChange}
          details={formData.details}
          onDetailsChange={(value) => setFormData(prev => ({ ...prev, details: value }))}
          onValidationChange={setHasValidationError}
        />

        {/* 智能文件上传 - 批量模式 */}
        <div className="flex-1">
          <SmartFileUpload
            mode="batch"
            files={attachments}
            onFilesChange={setAttachments}
            onAIDataExtracted={handleAIDataExtracted}
            onBatchAnalysisComplete={handleBatchAnalysisComplete}
            itemTypes={itemTypes}
            currencies={currencies}
            exchangeRates={exchangeRates}
          />
        </div>

        <div className="border-t pt-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Upload receipts above for auto-add, or manually fill in details and click the button.</span>
          </div>
          <Button
            onClick={handleAddItem}
            size="lg"
            disabled={!isFormValid}
            className="w-full sm:w-auto gap-2 px-6 font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-[1px] transition disabled:opacity-60 disabled:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            style={{
              animation: !isFormValid ? 'none' : 'subtle-bounce 2s ease-in-out infinite'
            }}
          >
            <PlusCircle className="h-5 w-5" />
            Add Expense Item
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
