import { ExpenseItem } from '../page'
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

interface CurrentItemsProps {
  items: ExpenseItem[]
  onRemoveItem: (id: number) => void
  onRestoreItem?: (item: ExpenseItem, index?: number) => void
  onDuplicateItem?: (item: ExpenseItem) => void
  totalSGD: number
}

import { toast } from 'sonner'

export default function CurrentItems({ items, onRemoveItem, onRestoreItem, onDuplicateItem, totalSGD }: CurrentItemsProps) {
  // 如果没有items，不显示整个组件
  if (items.length === 0) {
    return null
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
              {items.map((item) => (
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
                    <div className="flex items-center gap-2">
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
              ))}
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
