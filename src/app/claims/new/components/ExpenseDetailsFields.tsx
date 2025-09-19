'use client'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ExpenseItemTypeOption {
  id: number
  name: string
  no: string
}

export interface ExpenseCurrencyOption {
  id: number
  name: string
  code: string
}

interface ExpenseDetailsFieldsProps {
  mode: 'edit' | 'display'
  date?: Date | null
  dateDisplay?: string | null
  onDateChange?: (date: Date | null) => void
  itemNo?: string
  onItemNoChange?: (value: string) => void
  itemTypes?: ExpenseItemTypeOption[]
  currency?: string
  onCurrencyChange?: (value: string) => void
  currencies?: ExpenseCurrencyOption[]
  amount?: string
  onAmountChange?: (value: string) => void
  forexRate?: string
  onForexRateChange?: (value: string) => void
  sgdAmount?: string
  onSgdAmountChange?: (value: string) => void
  details?: string
  onDetailsChange?: (value: string) => void
}

const formatAmount = (value?: string | null, fractionDigits = 2) => {
  if (!value) return 'Not detected'
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return value
  }
  return parsed.toFixed(fractionDigits)
}

const formatRate = (value?: string | null) => {
  if (!value) return 'Not detected'
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return value
  }
  return parsed.toFixed(4)
}

export default function ExpenseDetailsFields({
  mode,
  date,
  dateDisplay,
  onDateChange,
  itemNo,
  onItemNoChange,
  itemTypes = [],
  currency,
  onCurrencyChange,
  currencies = [],
  amount,
  onAmountChange,
  forexRate,
  onForexRateChange,
  sgdAmount,
  onSgdAmountChange,
  details,
  onDetailsChange
}: ExpenseDetailsFieldsProps) {
  const formattedDate = date ? format(date, 'MM/dd/yyyy') : null
  const displayDate = dateDisplay || formattedDate || 'Not detected'

  const itemTypeLabel = itemTypes.find(type => type.no === itemNo)
  const currencyLabel = currencies.find(cur => cur.code === currency)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Date & Item */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-3">
          <Label className="text-sm font-semibold mb-1">Date</Label>
          {mode === 'edit' ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'MM/dd/yyyy') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date || undefined}
                  onSelect={(selectedDate) => onDateChange?.(selectedDate ?? null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <p className="text-sm p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
              {displayDate}
            </p>
          )}
        </div>

        <div className="sm:col-span-9">
          <Label className="text-sm font-semibold mb-1">Item No</Label>
          {mode === 'edit' ? (
            <Select value={itemNo || ''} onValueChange={(value) => onItemNoChange?.(value)}>
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
          ) : (
            <p className="text-sm p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
              {itemTypeLabel ? `${itemTypeLabel.no} - ${itemTypeLabel.name}` : itemNo || 'Not detected'}
            </p>
          )}
        </div>
      </div>

      {/* Amount row */}
      <div className="grid grid-cols-2 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-sm font-semibold mb-1">Currency</Label>
          {mode === 'edit' ? (
            <Select value={currency || ''} onValueChange={(value) => onCurrencyChange?.(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(cur => (
                  <SelectItem key={cur.id} value={cur.code}>
                    {cur.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
              {currencyLabel ? `${currencyLabel.code} - ${currencyLabel.name}` : currency || 'Not detected'}
            </p>
          )}
        </div>

        <div className="sm:col-span-3">
          <Label className="text-sm font-semibold mb-1">Amount</Label>
          {mode === 'edit' ? (
            <Input
              type="number"
              step="0.01"
              value={amount || ''}
              onChange={(e) => onAmountChange?.(e.target.value)}
            />
          ) : (
            <p className="text-sm p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
              {formatAmount(amount)}
            </p>
          )}
        </div>

        <div className="col-span-2 sm:col-span-2">
          <Label className="text-sm font-semibold mb-1">Rate</Label>
          {mode === 'edit' ? (
            <Input
              type="number"
              step="0.0001"
              value={forexRate || ''}
              onChange={(e) => onForexRateChange?.(e.target.value)}
            />
          ) : (
            <p className="text-sm p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
              {formatRate(forexRate)}
            </p>
          )}
        </div>

        <div className="col-span-2 sm:col-span-5">
          <Label className="text-sm font-semibold mb-1">SGD Amount</Label>
          {mode === 'edit' ? (
            <Input
              type="number"
              step="0.01"
              value={sgdAmount || ''}
              onChange={(e) => onSgdAmountChange?.(e.target.value)}
            />
          ) : (
            <p className="text-sm p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
              {formatAmount(sgdAmount)}
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold mb-1">
          <span className="hidden sm:inline">Details/Reason (Please Indicate Restaurant name or Supplier Name)</span>
          <span className="sm:hidden">Details/Reason</span>
        </Label>
        {mode === 'edit' ? (
          <Textarea
            placeholder="e.g., Meeting with KPMG - Taxi from office to Suntec tower one - (Comfort Delgro)"
            className="resize-vertical min-h-[80px]"
            value={details || ''}
            onChange={(e) => onDetailsChange?.(e.target.value)}
          />
        ) : (
          <p className="text-sm p-2 bg-gray-50 rounded border min-h-[80px] whitespace-pre-wrap">
            {details || 'Not detected'}
          </p>
        )}
      </div>
    </div>
  )
}

