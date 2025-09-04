import { ExpenseItem } from '../page'

interface CurrentItemsProps {
  items: ExpenseItem[]
  onRemoveItem: (id: number) => void
  totalSGD: number
}

export default function CurrentItems({ items, onRemoveItem, totalSGD }: CurrentItemsProps) {
  return (
    <div className="bg-white border border-gray-300 p-4 mb-6">
      <h3 className="text-md font-semibold mb-4 pb-2 border-b border-gray-200">
        Current Items
      </h3>

      <div className="max-h-64 overflow-y-auto border border-gray-300 mb-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-2 py-1 text-left font-semibold">Date</th>
              <th className="border border-gray-200 px-2 py-1 text-left font-semibold">Item No</th>
              <th className="border border-gray-200 px-2 py-1 text-left font-semibold">Description</th>
              <th className="border border-gray-200 px-2 py-1 text-left font-semibold">Amount</th>
              <th className="border border-gray-200 px-2 py-1 text-left font-semibold">SGD</th>
              <th className="border border-gray-200 px-2 py-1 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-200 px-2 py-8 text-center text-gray-500">
                  No expense items added yet
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1">{item.date}</td>
                  <td className="border border-gray-200 px-2 py-1">{item.itemNo}</td>
                  <td className="border border-gray-200 px-2 py-1">
                    <div className="max-w-xs">
                      <div className="truncate" title={item.note}>
                        {item.note}
                      </div>
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          📎 {item.attachments.length} file{item.attachments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-200 px-2 py-1">
                    {item.currency} {item.amount.toFixed(2)}
                  </td>
                  <td className="border border-gray-200 px-2 py-1">{item.sgdAmount.toFixed(2)}</td>
                  <td className="border border-gray-200 px-2 py-1">
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50 text-red-600"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-2 py-2 text-right font-semibold">
        <strong>Total SGD: {totalSGD.toFixed(2)}</strong>
      </div>
    </div>
  )
}