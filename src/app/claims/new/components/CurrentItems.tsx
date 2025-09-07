import { useState } from 'react'
import { ExpenseItem } from '../page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, Check, X, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

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

interface CurrentItemsProps {
  items: ExpenseItem[]
  onRemoveItem: (id: number) => void
  onRestoreItem?: (item: ExpenseItem, index?: number) => void
  onDuplicateItem?: (item: ExpenseItem) => void
  onEditItem?: (id: number, updatedItem: Partial<ExpenseItem>) => void
  itemTypes: ItemType[]
  currencies: Currency[]
  exchangeRates: Record<string, number>
  totalSGD: number
}

export default function CurrentItems({ 
  items, 
  onRemoveItem, 
  onRestoreItem, 
  onDuplicateItem, 
  onEditItem,
  itemTypes,
  currencies,
  exchangeRates,
  totalSGD 
}: CurrentItemsProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<ExpenseItem | null>(null)
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)

  // 如果没有items，不显示整个组件
  if (items.length === 0) {
    return null
  }

  // 计算函数
  const calculateSgdAmount = (amount: string, rate: string) => {
    const numAmount = parseFloat(amount) || 0
    const numRate = parseFloat(rate) || 0
    return (numAmount * numRate).toFixed(2)
  }

  // 开始编辑
  const startEditing = (item: ExpenseItem) => {
    setEditingId(item.id)
    setEditFormData({ ...item })
    setEditDate(new Date(item.date))
  }

  // 取消编辑
  const cancelEditing = () => {
    setEditingId(null)
    setEditFormData(null)
    setEditDate(undefined)
  }

  // 保存编辑
  const saveEdit = () => {
    if (!editFormData || !onEditItem) return

    // 验证
    if (!editDate) {
      toast.error('Date is required')
      return
    }
    
    if (!editFormData.itemNo) {
      toast.error('Item type is required')
      return
    }
    
    if (!editFormData.currency) {
      toast.error('Currency is required')
      return
    }
    
    if (!editFormData.amount || editFormData.amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    
    if (!editFormData.rate || editFormData.rate <= 0) {
      toast.error('Exchange rate must be greater than 0')
      return
    }
    
    if (!editFormData.sgdAmount || editFormData.sgdAmount <= 0) {
      toast.error('SGD amount must be greater than 0')
      return
    }

    // 保存更改
    onEditItem(editingId!, {
      ...editFormData,
      date: format(editDate, 'yyyy-MM-dd')
    })
    
    toast.success('Item updated successfully')
    cancelEditing()
  }

  // 处理货币变化
  const handleCurrencyChange = (currency: string) => {
    if (!editFormData) return
    
    const newRate = (exchangeRates[currency] || 1.0000).toFixed(4)
    const sgdAmount = calculateSgdAmount(editFormData.amount.toString(), newRate)
    
    setEditFormData(prev => ({
      ...prev!,
      currency,
      rate: parseFloat(newRate),
      sgdAmount: parseFloat(sgdAmount)
    }))
  }

  // 处理金额变化
  const handleAmountChange = (amount: string) => {
    if (!editFormData) return
    
    const sgdAmount = calculateSgdAmount(amount, editFormData.rate.toString())
    setEditFormData(prev => ({
      ...prev!,
      amount: parseFloat(amount) || 0,
      sgdAmount: parseFloat(sgdAmount)
    }))
  }

  // 处理汇率变化
  const handleRateChange = (rate: string) => {
    if (!editFormData) return
    
    const sgdAmount = calculateSgdAmount(editFormData.amount.toString(), rate)
    setEditFormData(prev => ({
      ...prev!,
      rate: parseFloat(rate) || 0,
      sgdAmount: parseFloat(sgdAmount)
    }))
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Current Items ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="max-h-64 overflow-y-auto overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="min-w-[80px]">Date</TableHead>
                <TableHead className="min-w-[60px]">Item</TableHead>
                <TableHead className="min-w-[150px]">Description</TableHead>
                <TableHead className="min-w-[110px] hidden sm:table-cell">Amount</TableHead>
                <TableHead className="min-w-[70px]">SGD</TableHead>
                <TableHead className="min-w-[120px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isEditing = editingId === item.id
                
                if (isEditing && editFormData) {
                  // 编辑模式
                  return (
                    <TableRow key={item.id} className="text-sm bg-blue-50">
                      {/* 日期 */}
                      <TableCell className="p-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-left font-normal text-xs h-8",
                                !editDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {editDate ? format(editDate, 'MM/dd') : <span>Date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={editDate}
                              onSelect={(date) => date && setEditDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      
                      {/* 项目类型 */}
                      <TableCell className="p-2">
                        <Select 
                          value={editFormData.itemNo} 
                          onValueChange={(value) => setEditFormData(prev => ({ ...prev!, itemNo: value }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {itemTypes.map(type => (
                              <SelectItem key={type.id} value={type.no}>
                                {type.no}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      {/* 详情 */}
                      <TableCell className="p-2">
                        <Textarea
                          value={editFormData.details}
                          onChange={(e) => setEditFormData(prev => ({ ...prev!, details: e.target.value }))}
                          className="min-h-[32px] text-xs resize-none"
                          placeholder="Details"
                        />
                      </TableCell>
                      
                      {/* 金额 (隐藏在移动端) */}
                      <TableCell className="hidden sm:table-cell p-2">
                        <div className="space-y-1">
                          <div className="flex gap-1">
                            <Select 
                              value={editFormData.currency} 
                              onValueChange={handleCurrencyChange}
                            >
                              <SelectTrigger className="h-8 text-xs w-20">
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
                            <Input
                              type="number"
                              step="0.01"
                              value={editFormData.amount}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              className="h-8 text-xs flex-1"
                            />
                          </div>
                          <Input
                            type="number"
                            step="0.0001"
                            value={editFormData.rate}
                            onChange={(e) => handleRateChange(e.target.value)}
                            placeholder="Rate"
                            className="h-6 text-[10px]"
                          />
                        </div>
                      </TableCell>
                      
                      {/* SGD金额 */}
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editFormData.sgdAmount}
                          onChange={(e) => setEditFormData(prev => ({ ...prev!, sgdAmount: parseFloat(e.target.value) || 0 }))}
                          className="h-8 text-xs font-mono"
                        />
                      </TableCell>
                      
                      {/* 操作按钮 */}
                      <TableCell className="p-2">
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={saveEdit}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-green-600 hover:bg-green-50"
                            title="Save"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-red-600 hover:bg-red-50"
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }
                
                // 正常显示模式
                return (
                  <TableRow key={item.id} className="text-sm">
                    <TableCell className="text-xs">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{item.itemNo}</TableCell>
                    <TableCell>
                      <div className="max-w-[150px] sm:max-w-xs">
                        <div className="truncate text-xs" title={item.details}>
                          {item.details}
                        </div>
                        {item.attachments && item.attachments.length > 0 && (
                          <button
                            type="button"
                            className="text-xs text-blue-600 mt-1 hover:underline"
                            onClick={() => {
                              // 简单预览：逐个打开
                              item.attachments?.forEach(f => {
                                if (f.type.startsWith('image/')) {
                                  const url = URL.createObjectURL(f)
                                  window.open(url, '_blank')
                                }
                              })
                            }}
                          >
                            📎 {item.attachments.length}
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">
                      {item.currency} {item.amount.toFixed(2)}
                      <div className="text-[10px] text-gray-500">rate: {item.rate.toFixed(4)}</div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold">
                      {item.sgdAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onEditItem && (
                          <Button
                            onClick={() => startEditing(item)}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            title="Edit"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                        {onDuplicateItem && (
                          <Button
                            onClick={() => onDuplicateItem(item)}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            title="Duplicate"
                          >Copy</Button>
                        )}
                        <Button
                          onClick={() => {
                            onRemoveItem(item.id)
                            if (onRestoreItem) {
                              toast(
                                'Item removed',
                                {
                                  action: {
                                    label: 'Undo',
                                    onClick: () => onRestoreItem(item),
                                  },
                                  duration: 4000,
                                }
                              )
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 h-7 px-2"
                          title="Remove item"
                        >
                          ×
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="bg-gray-50 px-3 sm:px-4 py-3 rounded-md border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{items.length} item{items.length > 1 ? 's' : ''}</span>
            <span className="text-lg font-semibold">Total SGD: {totalSGD.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
