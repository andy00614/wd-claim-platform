"use client"

import type { ReactNode } from "react"
import { FileText, Paperclip, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface ExpenseItemsTableAttachment {
  id: number | string
  fileName: string
  url?: string | null
  fileSize?: string | null
  fileType?: string | null
}

export interface ExpenseItemsTableItemBase {
  id: number | string
  date?: Date | string | null
  itemCode?: string | null
  itemName?: string | null
  description?: string | null
  details?: string | null
  currencyCode?: string | null
  amount?: number | string | null
  rate?: number | string | null
  sgdAmount?: number | string | null
  existingAttachments?: ExpenseItemsTableAttachment[] | null
  pendingAttachments?: File[] | null
  attachments?: File[] | null
}

interface ExpenseItemsTableProps<
  TItem extends ExpenseItemsTableItemBase = ExpenseItemsTableItemBase,
> {
  items: TItem[]
  className?: string
  tableClassName?: string
  attachmentsPlaceholder?: string
  emptyMessage?: string
  actionColumnLabel?: string
  onEdit?: (item: TItem) => void
  onDelete?: (item: TItem) => void
  renderActions?: (item: TItem) => ReactNode
}

const truncateName = (value: string) => {
  if (!value) return "Attachment"
  return value.length > 24 ? `${value.slice(0, 21)}...` : value
}

const formatAmount = (value: ExpenseItemsTableItemBase["amount"], digits = 2) => {
  if (value === null || value === undefined || value === "") {
    return "—"
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(digits) : "—"
  }

  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return parsed.toFixed(digits)
}

const formatRate = (value: ExpenseItemsTableItemBase["rate"]) => {
  if (value === null || value === undefined || value === "") {
    return "—"
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toFixed(4) : "—"
  }

  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return parsed.toFixed(4)
}

const formatDate = (value: ExpenseItemsTableItemBase["date"]) => {
  if (!value) {
    return "N/A"
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "N/A"
    }
    return value.toLocaleDateString()
  }

  return value
}

export default function ExpenseItemsTable<
  TItem extends ExpenseItemsTableItemBase = ExpenseItemsTableItemBase,
>({
  items,
  className,
  tableClassName,
  attachmentsPlaceholder = "No files",
  emptyMessage = "No expense items found",
  actionColumnLabel = "Actions",
  onEdit,
  onDelete,
  renderActions,
}: ExpenseItemsTableProps<TItem>) {
  const hasActions = Boolean(onEdit || onDelete || renderActions)
  const columnCount = 6 + (hasActions ? 1 : 0)

  const buildActions = (item: TItem) => {
    if (renderActions) {
      return renderActions(item)
    }

    if (!onEdit && !onDelete) {
      return null
    }

    return (
      <div className="flex items-center justify-end gap-2">
        {onEdit && (
          <Button
            onClick={() => onEdit(item)}
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            title="Edit item"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={() => onDelete(item)}
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            title="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table className={tableClassName}>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Item Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Amount (≈ SGD)</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-center">Attachments</TableHead>
            {hasActions && <TableHead className="text-right">{actionColumnLabel}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const existingAttachments = item.existingAttachments ?? []
              const pendingAttachments = item.pendingAttachments
                ?? (Array.isArray(item.attachments) ? item.attachments : [])

              const hasAttachments = existingAttachments.length > 0 || pendingAttachments.length > 0
              const formattedAmount = formatAmount(item.amount)
              const formattedSgdAmount = formatAmount(item.sgdAmount)
              const currencySuffix = item.currencyCode ? ` ${item.currencyCode}` : ""
              const combinedAmountLabel = (() => {
                if (formattedAmount !== "—" && formattedSgdAmount !== "—") {
                  return `${formattedAmount}${currencySuffix} ≈ ${formattedSgdAmount} SGD`
                }

                if (formattedAmount !== "—") {
                  return `${formattedAmount}${currencySuffix}`
                }

                if (formattedSgdAmount !== "—") {
                  return `${formattedSgdAmount} SGD`
                }

                return "—"
              })()

              return (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>
                    {(item.itemCode || item.itemName) ? (
                      <div className="space-y-1">
                        {item.itemCode ? (
                          <div className="font-medium text-xs">{item.itemCode}</div>
                        ) : null}
                        {item.itemName ? (
                          <div className="text-xs text-muted-foreground">{item.itemName}</div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div
                      className="truncate text-xs text-muted-foreground"
                      title={item.details ?? undefined}
                    >
                      {item.details ? item.details : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="whitespace-nowrap">{combinedAmountLabel}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatRate(item.rate)}
                  </TableCell>
                  <TableCell className="align-middle text-center">
                    {hasAttachments ? (
                      <div className="flex flex-col items-center gap-1">
                        {existingAttachments.map((attachment) => {
                          const label = truncateName(attachment.fileName)
                          const title = [attachment.fileName, attachment.fileType, attachment.fileSize]
                            .filter(Boolean)
                            .join(" • ")

                          if (attachment.url) {
                            return (
                              <Button
                                key={`existing-${attachment.id}`}
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 justify-center"
                              >
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={title || attachment.fileName}
                                >
                                  <FileText className="mr-1 h-3 w-3" />
                                  <span className="truncate max-w-[140px] text-xs">{label}</span>
                                </a>
                              </Button>
                            )
                          }

                          return (
                            <div
                              key={`existing-${attachment.id}`}
                              className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
                              title={title || attachment.fileName}
                            >
                              <Paperclip className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{label}</span>
                            </div>
                          )
                        })}

                        {pendingAttachments.map((file, index) => {
                          const fileName = typeof file.name === "string" && file.name !== ""
                            ? file.name
                            : `Attachment ${index + 1}`

                          return (
                            <div
                              key={`pending-${item.id}-${index}`}
                              className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
                              title={fileName}
                            >
                              <Paperclip className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{truncateName(fileName)}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{attachmentsPlaceholder}</span>
                    )}
                  </TableCell>
                  {hasActions ? (
                    <TableCell className="text-right align-top">
                      {buildActions(item)}
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
