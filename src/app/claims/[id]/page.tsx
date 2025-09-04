import { getClaimDetails } from '@/lib/actions'
import Link from 'next/link'

interface ClaimDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClaimDetailPage({ params }: ClaimDetailPageProps) {
  const { id } = await params
  const claimId = parseInt(id, 10)
  
  const claimData = await getClaimDetails(claimId)

  if (!claimData.success || !claimData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">加载失败</h1>
          <p className="text-gray-600">{claimData.error}</p>
          <Link href="/claims" className="text-blue-600 hover:underline mt-2 block">
            返回申请列表
          </Link>
        </div>
      </div>
    )
  }

  const { claim, items, attachments, employee } = claimData.data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="bg-white border-2 border-black p-4 mb-6 text-center">
          <h1 className="text-xl font-bold">Wild Dynasty Pte Ltd</h1>
          <h2 className="text-sm">Expense Claim Details</h2>
        </div>

        {/* 返回按钮 */}
        <div className="mb-6">
          <Link 
            href="/claims"
            className="inline-flex items-center px-4 py-2 border border-gray-300 hover:bg-gray-50"
          >
            ← Back to Claims
          </Link>
        </div>

        {/* 申请信息 */}
        <div className="bg-white border border-gray-300 p-6 mb-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Claim Information</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Claim ID:</strong> CL-2024-{claim.id.toString().padStart(4, '0')}</div>
                <div><strong>Employee:</strong> {employee.name} (EMP{employee.employeeCode.toString().padStart(3, '0')})</div>
                <div><strong>Date:</strong> {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    claim.status === 'approved' 
                      ? 'text-green-700 bg-green-100' 
                      : claim.status === 'submitted'
                      ? 'text-orange-700 bg-orange-100'
                      : 'text-gray-700 bg-gray-100'
                  }`}>
                    {claim.status === 'approved' ? 'Approved' : 
                     claim.status === 'submitted' ? 'Pending' : 
                     claim.status}
                  </span>
                </div>
                <div><strong>Total Amount:</strong> SGD {parseFloat(claim.totalAmount).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 申请项目详情 */}
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
                    <th className="text-left p-3 font-semibold">Details</th>
                    <th className="text-left p-3 font-semibold">Currency</th>
                    <th className="text-left p-3 font-semibold">Amount</th>
                    <th className="text-left p-3 font-semibold">Rate</th>
                    <th className="text-left p-3 font-semibold">SGD Amount</th>
                    <th className="text-left p-3 font-semibold">Evidence</th>
                    <th className="text-left p-3 font-semibold">Attachments</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-3">{item.itemTypeNo} - {item.itemTypeName}</td>
                      <td className="p-3">{item.note}</td>
                      <td className="p-3 max-w-xs">
                        <div className="truncate" title={item.details || ''}>
                          {item.details}
                        </div>
                      </td>
                      <td className="p-3">{item.currencyCode}</td>
                      <td className="p-3">{parseFloat(item.amount).toFixed(2)}</td>
                      <td className="p-3">{parseFloat(item.rate).toFixed(4)}</td>
                      <td className="p-3">{parseFloat(item.sgdAmount).toFixed(2)}</td>
                      <td className="p-3">{item.evidenceNo || 'N/A'}</td>
                      <td className="p-3">
                        {item.attachments && item.attachments.length > 0 ? (
                          <div className="space-y-1">
                            {item.attachments.map((attachment: any) => (
                              <div key={attachment.id} className="flex items-center gap-2 text-xs">
                                <span>📄</span>
                                <a 
                                  href={attachment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate max-w-[100px]"
                                  title={attachment.fileName}
                                >
                                  {attachment.fileName}
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No files</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 总计 */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Items: {items.length}</div>
                <div className="text-lg font-semibold">Total: SGD {parseFloat(claim.totalAmount).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 附件列表 */}
        {attachments && attachments.length > 0 && (
          <div className="bg-white border border-gray-300 mb-6">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Supporting Documents</h3>
              
              <div className="space-y-2">
                {attachments.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <div>
                        <div className="font-medium text-sm">{attachment.fileName}</div>
                        <div className="text-xs text-gray-500">
                          {attachment.fileType} • {Math.round(parseFloat(attachment.fileSize) / 1024)} KB
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 border border-gray-300 hover:bg-gray-50 text-sm rounded"
                      >
                        View
                      </a>
                      <a 
                        href={attachment.url}
                        download={attachment.fileName}
                        className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 text-sm rounded"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <Link 
            href="/claims"
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50"
          >
            Back to Claims
          </Link>
          
          {claim.status === 'submitted' && (
            <Link 
              href={`/claims/${claim.id}/edit`}
              className="px-4 py-2 bg-black text-white hover:bg-gray-800"
            >
              Edit Claim
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}