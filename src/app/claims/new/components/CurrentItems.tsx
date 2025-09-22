'use client'

import { format, parse } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Paperclip, Pencil, Trash2 } from 'lucide-react'
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
    return parse(value, 'MM/dd', new Date())
  } catch (error) {
    return new Date()
  }
}

const formatItemDate = (value: string) => {
  try {
    return format(parse(value, 'MM/dd', new Date()), 'MMM dd')
  } catch (error) {
    return value
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
        const matchedRate = exchangeRates[aiData.currency]
        if (typeof matchedRate === 'number') {
          next.forexRate = matchedRate.toFixed(4)
        }
      }

      if (aiData.amount) {
        next.amount = aiData.amount
        const rateToUse = aiData.forexRate || next.forexRate || '1.0000'
        next.sgdAmount = calculateSgdAmount(aiData.amount, rateToUse)
      }

      if (aiData.forexRate) {
        next.forexRate = aiData.forexRate
        if (aiData.amount || next.amount) {
          next.sgdAmount = calculateSgdAmount(aiData.amount || next.amount, aiData.forexRate)
        }
      }

      if (aiData.sgdAmount) {
        next.sgdAmount = aiData.sgdAmount
        if (!aiData.forexRate && (aiData.amount || next.amount)) {
          next.forexRate = calculateForexRate(aiData.sgdAmount, aiData.amount || next.amount)
        }
      }

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
          <div className="max-h-64 overflow-y-auto overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Date</TableHead>
                  <TableHead className="min-w-[60px]">Item</TableHead>
                  <TableHead className="min-w-[150px]">Description</TableHead>
                  <TableHead className="min-w-[80px] hidden sm:table-cell">Amount</TableHead>
                  <TableHead className="min-w-[70px]">SGD</TableHead>
                  <TableHead className="min-w-[140px]">Attachments</TableHead>
                  <TableHead className="min-w-[90px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="text-sm">
                    <TableCell className="text-xs">{formatItemDate(item.date)}</TableCell>
                    <TableCell className="text-xs font-mono">{item.itemNo}</TableCell>
                    <TableCell>
                      <div className="max-w-[150px] sm:max-w-xs">
                        <div className="truncate text-xs" title={item.details}>
                          {item.details}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs">
                      {item.currency} {item.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold">
                      {item.sgdAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="align-top">
                      {(() => {
                        const existing = item.existingAttachments || []
                        const pending = item.attachments || []
                        const hasAttachments = existing.length > 0 || pending.length > 0

                        if (!hasAttachments) {
                          return <span className="text-xs text-muted-foreground">—</span>
                        }

                        return (
                          <div className="space-y-1">
                            {existing.map((attachment) => (
                              <a
                                key={`existing-${attachment.id}`}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-primary hover:underline max-w-[180px]"
                                title={attachment.fileName}
                              >
                                <Paperclip className="h-3 w-3 flex-shrink-0" />
                                <span className="block truncate">{truncateAttachmentName(attachment.fileName)}</span>
                              </a>
                            ))}

                            {pending.map((file, index) => {
                              const fileName = typeof file.name === 'string' ? file.name : ''
                              return (
                                <div
                                  key={`pending-${item.id}-${index}`}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[180px]"
                                  title={fileName || 'Attachment'}
                                >
                                  <Paperclip className="h-3 w-3 flex-shrink-0" />
                                  <span className="block truncate">{truncateAttachmentName(fileName)}</span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleOpenEdit(item)}
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Edit item"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => onRemoveItem(item.id)}
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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

      {isEditMode && (
        <ExistingAttachments
          attachments={existingAttachments}
          title="Current Attachments"
        />
      )}

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
