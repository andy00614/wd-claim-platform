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

        <div className="max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item No</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>SGD</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.itemNo}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="truncate" title={item.details}>
                        {item.details}
                      </div>
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          📎 {item.attachments.length} file{item.attachments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.currency} {item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{item.sgdAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => onRemoveItem(item.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
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

        <div className="bg-gray-50 px-4 py-3 rounded-md border text-right">
          <span className="text-lg font-semibold">Total SGD: {totalSGD.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  )
}