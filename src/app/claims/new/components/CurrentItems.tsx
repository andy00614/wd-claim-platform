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
  totalSGD: number
}

export default function CurrentItems({ items, onRemoveItem, totalSGD }: CurrentItemsProps) {
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
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[80px]">Date</TableHead>
                <TableHead className="min-w-[60px]">Item</TableHead>
                <TableHead className="min-w-[150px]">Description</TableHead>
                <TableHead className="min-w-[80px] hidden sm:table-cell">Amount</TableHead>
                <TableHead className="min-w-[70px]">SGD</TableHead>
                <TableHead className="min-w-[60px]">Action</TableHead>
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
                        <div className="text-xs text-blue-600 mt-1">
                          📎 {item.attachments.length}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">
                    {item.currency} {item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold">
                    {item.sgdAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => onRemoveItem(item.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                      title="Remove item"
                    >
                      ×
                    </Button>
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