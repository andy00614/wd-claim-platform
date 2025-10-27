'use client'

import { format, parse } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import ExpenseItemsTable, { type ExpenseItemsTableItemBase } from '@/components/claims/ExpenseItemsTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText } from 'lucide-react'
import type { ExpenseItem } from '../page'
import ExpenseDetailsFields from './ExpenseDetailsFields'
import ExistingAttachments from './ExistingAttachments'
import SmartFileUpload from './SmartFileUpload'
import type { ExpenseCurrencyOption, ExpenseItemTypeOption } from './ExpenseDetailsFields'
import type { ExpenseAnalysisResult } from './types'

interface Attachment {
  id: number
  claimId: number | null
  claimItemId: number | null
  fileName: string
  url: string
  fileSize: string
  fileType: string
  createdAt: Date | string | null
  updatedAt: Date | string | null
}

interface CurrentItemsProps {
  items: ExpenseItem[]
  onRemoveItem: (id: number) => void
  onEditItem: (item: ExpenseItem) => void
  totalSGD: number
  itemTypes: ExpenseItemTypeOption[]
  currencies: ExpenseCurrencyOption[]
  exchangeRates: Record<string, number>
  existingAttachments?: Attachment[]
  isEditMode?: boolean
}

interface EditFormState {
  date: string
  itemNo: string
  details: string
  currency: string
  amount: string
  forexRate: string
  sgdAmount: string
  attachments: File[]
}

type PreparedExpenseItem = ExpenseItemsTableItemBase & Omit<ExpenseItem, 'date'> & {
  originalItem: ExpenseItem
  date: Date
}

const calculateSgdAmount = (amount: string, rate: string) => {
  const parsedAmount = parseFloat(amount) || 0
  const parsedRate = parseFloat(rate) || 0
  return (parsedAmount * parsedRate).toFixed(2)
}

const calculateForexRate = (sgdAmount: string, amount: string) => {
  const parsedSgd = parseFloat(sgdAmount) || 0
  const parsedAmount = parseFloat(amount) || 0
  if (parsedAmount === 0) return '0.0000'
  return (parsedSgd / parsedAmount).toFixed(4)
}

const truncateAttachmentName = (value: string) => {
  if (!value) return 'Attachment'
  return value.length > 24 ? `${value.slice(0, 21)}...` : value
}

const parseDateString = (value: string) => {
  if (!value) return new Date()
  try {
    // Parse MM/dd format with current year
    const currentYear = new Date().getFullYear()
    return parse(value, 'MM/dd', new Date(currentYear, 0, 1))
  } catch (error) {
    return new Date()
  }
}

export default function CurrentItems({
  items,
  onRemoveItem,
  onEditItem,
  totalSGD,
  itemTypes,
  currencies,
  exchangeRates,
  existingAttachments = [],
  isEditMode = false,
}: CurrentItemsProps) {
  if (items.length === 0) {
    return null
  }

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null)
  const [formState, setFormState] = useState<EditFormState | null>(null)
  const [localFiles, setLocalFiles] = useState<File[]>([])

  const itemTypeLabelMap = useMemo(() => {
    return new Map(itemTypes.map((type) => [type.no, type.name]))
  }, [itemTypes])

  const tableItems = useMemo<PreparedExpenseItem[]>(() => {
    return items.map((item) => ({
      ...item,
      originalItem: item,
      date: parseDateString(item.date),
      itemCode: item.itemNo,
      itemName: itemTypeLabelMap.get(item.itemNo) ?? undefined,
      description: '',
      details: item.details,
      currencyCode: item.currency,
      amount: item.amount,
      rate: item.rate,
      sgdAmount: item.sgdAmount,
      existingAttachments: item.existingAttachments ?? [],
      pendingAttachments: item.attachments ?? [],
    }))
  }, [items, itemTypeLabelMap])

  useEffect(() => {
    if (!editingItem) return

    const existingFiles = (editingItem.attachments || []).filter(
      (attachment): attachment is File => attachment instanceof File
    )

    setFormState({
      date: editingItem.date,
      itemNo: editingItem.itemNo,
      details: editingItem.details,
      currency: editingItem.currency,
      amount: editingItem.amount.toFixed(2),
      forexRate: editingItem.rate.toFixed(4),
      sgdAmount: editingItem.sgdAmount.toFixed(2),
      attachments: existingFiles
    })
    setLocalFiles(existingFiles)
  }, [editingItem])

  const editingDate = useMemo(() => {
    if (!formState) return null
    return parseDateString(formState.date)
  }, [formState])

  const handleOpenEdit = (item: ExpenseItem) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false)
    setEditingItem(null)
    setFormState(null)
    setLocalFiles([])
  }

  const handleFieldUpdate = (updates: Partial<EditFormState>) => {
    setFormState((prev) => {
      if (!prev) return prev

      // 检查是否真的有变化，避免不必要的更新
      const hasChanges = Object.keys(updates).some(key =>
        prev[key as keyof EditFormState] !== updates[key as keyof EditFormState]
      )

      if (!hasChanges) return prev

      return {
        ...prev,
        ...updates,
      }
    })
  }

  const handleCurrencyChange = (value: string) => {
    const matchedRate = exchangeRates[value]
    const nextRate = typeof matchedRate === 'number' ? matchedRate.toFixed(4) : formState?.forexRate || '1.0000'
    const nextAmount = formState?.amount || '0'

    handleFieldUpdate({
      currency: value,
      forexRate: nextRate,
      sgdAmount: calculateSgdAmount(nextAmount, nextRate),
    })
  }

  const handleAmountChange = (value: string) => {
    const rate = formState?.forexRate || '1.0000'
    handleFieldUpdate({
      amount: value,
      sgdAmount: calculateSgdAmount(value, rate),
    })
  }

  const handleForexRateChange = (value: string) => {
    const amount = formState?.amount || '0'
    handleFieldUpdate({
      forexRate: value,
      sgdAmount: calculateSgdAmount(amount, value),
    })
  }

  const handleSgdAmountChange = (value: string) => {
    const amount = formState?.amount || '0'
    handleFieldUpdate({
      sgdAmount: value,
      forexRate: calculateForexRate(value, amount),
    })
  }

  const handleSave = () => {
    if (!editingItem || !formState) return

    const updatedItem: ExpenseItem = {
      ...editingItem,
      date: formState.date,
      itemNo: formState.itemNo,
      details: formState.details,
      currency: formState.currency,
      amount: parseFloat(formState.amount) || 0,
      rate: parseFloat(formState.forexRate) || 0,
      sgdAmount: parseFloat(formState.sgdAmount) || 0,
      attachments: localFiles,
      existingAttachments: editingItem.existingAttachments
    }

    onEditItem(updatedItem)
    handleCloseEdit()
  }

  const handleFilesChange = (files: File[]) => {
    setLocalFiles(files)
    handleFieldUpdate({ attachments: files })
  }

  const applyAIData = (aiData: ExpenseAnalysisResult) => {
    setFormState(prev => {
      if (!prev) return prev

      const next = { ...prev }

      if (aiData.date) {
        next.date = aiData.date
      }

      if (aiData.itemNo) {
        next.itemNo = aiData.itemNo
      }

      if (aiData.details) {
        next.details = aiData.details
      }

      if (aiData.currency) {
        next.currency = aiData.currency
        // 从 exchangeRates 查找正确的汇率
        const matchedRate = exchangeRates[aiData.currency]
        if (typeof matchedRate === 'number') {
          next.forexRate = matchedRate.toFixed(4)
        }
      }

      if (aiData.amount) {
        next.amount = aiData.amount
        // 优先使用从 exchangeRates 查找的汇率，而不是 AI 提供的汇率
        const rateToUse = next.forexRate || '1.0000'
        next.sgdAmount = calculateSgdAmount(aiData.amount, rateToUse)
      }

      // 注意：不要直接使用 AI 提供的 forexRate，因为 AI 可能不知道正确的汇率
      // 汇率应该已经在上面的 currency 处理中从 exchangeRates 查找了

      return next
    })
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Current Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExpenseItemsTable
            className="max-h-64 overflow-y-auto overflow-x-auto"
            items={tableItems}
            actionColumnLabel="Action"
            onEdit={(item) => handleOpenEdit(item.originalItem)}
            onDelete={(item) => onRemoveItem(item.originalItem.id)}
          />

          <div className="bg-gray-50 px-3 sm:px-4 py-3 rounded-md border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {items.length} item{items.length > 1 ? 's' : ''}
              </span>
              <span className="text-lg font-semibold">Total SGD: {totalSGD.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseEdit()
          }
        }}
      >
        <DialogContent className="sm:max-w-[960px]">
          <DialogHeader>
            <DialogTitle>Edit Expense Item</DialogTitle>
          </DialogHeader>

          {formState && (
            <ExpenseDetailsFields
              mode="edit"
              date={editingDate}
              dateDisplay={formState.date}
              onDateChange={(date) =>
                handleFieldUpdate({ date: date ? format(date, 'MM/dd') : formState.date })
              }
              itemNo={formState.itemNo}
              onItemNoChange={(value) => handleFieldUpdate({ itemNo: value })}
              itemTypes={itemTypes}
              currency={formState.currency}
              onCurrencyChange={handleCurrencyChange}
              currencies={currencies}
              amount={formState.amount}
              onAmountChange={handleAmountChange}
              forexRate={formState.forexRate}
              onForexRateChange={handleForexRateChange}
              sgdAmount={formState.sgdAmount}
              onSgdAmountChange={handleSgdAmountChange}
              details={formState.details}
              onDetailsChange={(value) => handleFieldUpdate({ details: value })}
            />
          )}

          <div className="border border-gray-200 rounded-md p-4 space-y-3">
            <h4 className="text-sm font-semibold">Smart File Upload with AI Analysis</h4>
            <SmartFileUpload
              files={localFiles}
              onFilesChange={handleFilesChange}
              onAIDataExtracted={applyAIData}
              itemTypes={itemTypes}
              currencies={currencies}
              exchangeRates={exchangeRates}
            />
          </div>

          {editingItem?.existingAttachments && editingItem.existingAttachments.length > 0 && (
            <div className="border border-gray-200 rounded-md p-4 space-y-2">
              <h4 className="text-sm font-semibold">Existing Attachments</h4>
              <div className="space-y-1">
                {editingItem.existingAttachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                    title={attachment.fileName}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="truncate max-w-[240px]">
                      {truncateAttachmentName(attachment.fileName)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formState}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
