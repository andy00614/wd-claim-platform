'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Plus } from 'lucide-react'
import { ExpenseItem } from '../page'
import ItemFileUpload from './ItemFileUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from "sonner"

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
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-3">
            <Label className="text-sm font-semibold mb-1">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'MM/dd/yyyy') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="sm:col-span-9">
            <Label className="text-sm font-semibold mb-1">Item No</Label>
            <Select value={formData.itemNo} onValueChange={(value) => setFormData({ ...formData, itemNo: value })}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map(type => (
                  <SelectItem key={type.id} value={type.no} className="cursor-pointer">
                    <span className="font-medium">{type.no}</span> - {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 金额行 */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-sm font-semibold mb-1">Currency</Label>
            <Select value={formData.currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency.id} value={currency.code}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Label className="text-sm font-semibold mb-1">Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
          </div>

          <div className="col-span-2 sm:col-span-2">
            <Label className="text-sm font-semibold mb-1">Rate</Label>
            <Input
              type="number"
              step="0.0001"
              value={formData.forexRate}
              onChange={(e) => handleForexRateChange(e.target.value)}
            />
          </div>

          <div className="col-span-2 sm:col-span-5">
            <Label className="text-sm font-semibold mb-1">SGD Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.sgdAmount}
              onChange={(e) => handleSgdAmountChange(e.target.value)}
            />
          </div>
        </div>

        {/* 详细说明 */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold mb-1">
            <span className="hidden sm:inline">Details/Reason (Please Indicate Restaurant name or Supplier Name)</span>
            <span className="sm:hidden">Details/Reason</span>
          </Label>
          <Textarea
            placeholder="e.g., Meeting with KPMG - Taxi from office to Suntec tower one - (Comfort Delgro)"
            className="resize-vertical min-h-[80px]"
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
          />
        </div>

        {/* 文件上传和添加按钮 */}
        <div className="flex-1">
          <ItemFileUpload
            files={attachments}
            onFilesChange={setAttachments}
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