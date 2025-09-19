'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { ExpenseItem } from '../page'
import SmartFileUpload from './SmartFileUpload'
import { ExpenseAnalysisResult } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from "sonner"
import ExpenseDetailsFields from './ExpenseDetailsFields'

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

  // 处理AI分析结果 - 智能合并策略，复用现有逻辑
  const handleAIDataExtracted = (aiData: ExpenseAnalysisResult) => {
    console.log('AI data received:', aiData)

    // 智能合并：只填充当前为空的字段，保护用户已输入的数据
    const newFormData = { ...formData }
    let newDate = date

    // 日期优先使用AI识别的结果
    if (aiData.date) {
      try {
        const [month, day] = aiData.date.split('/')
        const currentYear = new Date().getFullYear()
        newDate = new Date(currentYear, parseInt(month) - 1, parseInt(day))
        setDate(newDate)
      } catch (error) {
        console.warn('Failed to parse AI date:', aiData.date)
      }
    }

    // 其他字段：仅在当前为空时填充
    if (!newFormData.itemNo && aiData.itemNo) {
      newFormData.itemNo = aiData.itemNo
    }

    if (!newFormData.details && aiData.details) {
      newFormData.details = aiData.details
    }

    if (!newFormData.currency && aiData.currency) {
      newFormData.currency = aiData.currency
    }

    if (!newFormData.amount && aiData.amount) {
      newFormData.amount = aiData.amount
    }

    // 如果AI提供了汇率和SGD金额，直接使用
    if (aiData.forexRate) {
      newFormData.forexRate = aiData.forexRate
    }

    if (aiData.sgdAmount) {
      newFormData.sgdAmount = aiData.sgdAmount
    }

    // 如果AI没有提供汇率但提供了货币和金额，使用现有逻辑计算
    if (aiData.currency && aiData.amount && !aiData.forexRate) {
      const newRate = (exchangeRates[aiData.currency] || 1.0000).toFixed(4)
      const sgdAmount = calculateSgdAmount(aiData.amount, newRate)

      newFormData.forexRate = newRate
      newFormData.sgdAmount = sgdAmount
    }

    setFormData(newFormData)
  }

  const handleAddItem = () => {
    if (!date || !formData.itemNo || !formData.amount) {
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
      attachments: [...attachments]
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
        />

        {/* 智能文件上传 */}
        <div className="flex-1">
          <SmartFileUpload
            files={attachments}
            onFilesChange={setAttachments}
            onAIDataExtracted={handleAIDataExtracted}
            itemTypes={itemTypes}
            currencies={currencies}
            exchangeRates={exchangeRates}
          />
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleAddItem}
            size="sm"
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add to List
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
