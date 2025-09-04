'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
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
    note: 'Business meeting lunch',
    details: 'Meeting with KPMG - Taxi from office to Suntec tower one - (Comfort Delgro)',
    currency: 'SGD',
    amount: '45.80',
    sgdAmount: '45.80',
    evidenceNo: '001'
  })
  
  const [attachments, setAttachments] = useState<File[]>([])

  const forexRate = exchangeRates[formData.currency] || 1.0000
  // 当汇率或金额改变时，自动计算 SGD 金额
  const handleAmountChange = (amount: string) => {
    setFormData(prev => ({
      ...prev,
      amount,
      sgdAmount: ((parseFloat(amount) || 0) * forexRate).toFixed(2)
    }))
  }
  
  const handleCurrencyChange = (currency: string) => {
    const newRate = exchangeRates[currency] || 1.0000
    setFormData(prev => ({
      ...prev,
      currency,
      sgdAmount: ((parseFloat(prev.amount) || 0) * newRate).toFixed(2)
    }))
  }

  const handleAddItem = () => {
    if (!date || !formData.itemNo || !formData.note || !formData.amount) {
      toast.error('请填写所有必填字段')
      return
    }

    const item = {
      date: format(date, 'MM/dd'),
      itemNo: formData.itemNo,
      note: formData.note,
      details: formData.details,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      rate: forexRate,
      sgdAmount: parseFloat(formData.sgdAmount),
      evidenceNo: formData.evidenceNo,
      attachments: [...attachments]
    }

    onAddItem(item)
    
    // 清空表单
    setDate(new Date())
    setFormData({
      itemNo: '',
      note: '',
      details: '',
      currency: 'SGD',
      amount: '',
      sgdAmount: '',
      evidenceNo: ''
    })
    setAttachments([])
  }


  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-md">Expense Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 第一行：日期、项目类型、备注 */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <Label className="text-sm font-medium">Date</Label>
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

          <div className="col-span-4">
            <Label className="text-sm font-medium">Item No</Label>
            <Select value={formData.itemNo} onValueChange={(value) => setFormData({...formData, itemNo: value})}>
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

          <div className="col-span-5">
            <Label className="text-sm font-medium">Item / Note</Label>
            <Input
              type="text"
              placeholder="Brief description"
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
            />
          </div>
        </div>

        {/* 详细说明 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Details/Reason (Please Indicate Restaurant name or Supplier Name)
          </Label>
          <Textarea
            placeholder="e.g., Meeting with KPMG - Taxi from office to Suntec tower one - (Comfort Delgro)"
            className="resize-vertical min-h-[80px]"
            value={formData.details}
            onChange={(e) => setFormData({...formData, details: e.target.value})}
          />
        </div>

        {/* 金额行 */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-2">
            <Label className="text-sm font-medium">Currency</Label>
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

          <div className="col-span-3">
            <Label className="text-sm font-medium">Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <Label className="text-sm font-medium">Forex Rate</Label>
            <Input
              type="text"
              disabled
              value={forexRate.toFixed(4)}
            />
          </div>

          <div className="col-span-3">
            <Label className="text-sm font-medium">SGD Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.sgdAmount}
              onChange={(e) => setFormData({...formData, sgdAmount: e.target.value})}
            />
          </div>

          <div className="col-span-2">
            <Label className="text-sm font-medium">Evidence</Label>
            <Input
              type="text"
              placeholder="No."
              value={formData.evidenceNo}
              onChange={(e) => setFormData({...formData, evidenceNo: e.target.value})}
            />
          </div>
        </div>

        {/* 文件上传区域 */}
        <ItemFileUpload
          files={attachments}
          onFilesChange={setAttachments}
        />

        {/* 添加按钮 */}
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            onClick={handleAddItem}
            size="lg"
            className="bg-black text-white hover:bg-gray-800"
          >
            + Add Item
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}