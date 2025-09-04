import { loadDraft } from '@/lib/actions'
import { redirect } from 'next/navigation'
import SubmitDraftForm from './components/SubmitDraftForm'

interface SubmitDraftPageProps {
  params: Promise<{ id: string }>
}

export default async function SubmitDraftPage({ params }: SubmitDraftPageProps) {
  const { id } = await params
  const draftId = parseInt(id, 10)
  
  const draftData = await loadDraft(draftId)

  if (!draftData.success || !draftData.data) {
    redirect('/claims')
  }

  const { draft, items } = draftData.data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="bg-white border-2 border-black p-4 mb-6 text-center">
          <h1 className="text-xl font-bold">Wild Dynasty Pte Ltd</h1>
          <h2 className="text-sm">Submit Draft Claim</h2>
        </div>

        {/* 草稿信息 */}
        <div className="bg-white border border-gray-300 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Draft Information</h3>
          <div className="text-sm space-y-2">
            <div><strong>Draft ID:</strong> CL-2024-{draft.id.toString().padStart(4, '0')}</div>
            <div><strong>Created:</strong> {draft.createdAt ? new Date(draft.createdAt).toLocaleDateString() : 'N/A'}</div>
            <div><strong>Last Updated:</strong> {draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString() : 'N/A'}</div>
            <div><strong>Total Amount:</strong> SGD {parseFloat(draft.totalAmount).toFixed(2)}</div>
            <div><strong>Items Count:</strong> {items.length}</div>
          </div>
        </div>

        {/* 项目详情 */}
        {items.length > 0 && (
          <div className="bg-white border border-gray-300 mb-6">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Expense Items</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Item Type</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                      <th className="text-left p-3 font-semibold">Currency</th>
                      <th className="text-left p-3 font-semibold">Amount</th>
                      <th className="text-left p-3 font-semibold">SGD Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-3">{item.itemTypeNo}</td>
                        <td className="p-3">{item.note}</td>
                        <td className="p-3">{item.currencyCode}</td>
                        <td className="p-3">{parseFloat(item.amount).toFixed(2)}</td>
                        <td className="p-3">{parseFloat(item.sgdAmount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 提交表单 */}
        <SubmitDraftForm draftId={draftId} />
      </div>
    </div>
  )
}