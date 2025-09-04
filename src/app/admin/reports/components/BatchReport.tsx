'use client'

import { useState } from 'react'

interface ClaimData {
  claim: {
    id: number
    status: string
    totalAmount: string
    createdAt: Date | null
    adminNotes: string | null
  }
  items: Array<{
    id: number
    date: Date | null
    itemTypeNo: string
    itemTypeName: string
    note: string | null
    details: string | null
    currencyCode: string
    amount: string
    rate: string
    sgdAmount: string
    evidenceNo: string | null
    attachments?: Array<{
      id: number
      fileName: string
      url: string
      fileType: string
      fileSize: string
    }>
  }>
  attachments: Array<{
    id: number
    fileName: string
    url: string
    fileType: string
    fileSize: string
    claimId?: number | null
    claimItemId?: number | null
    createdAt?: Date | null
    updatedAt?: Date | null
  }> | undefined
  employee: {
    name: string
    employeeCode: number
    department?: string
  }
}

interface BatchReportProps {
  claims: ClaimData[]
}

export default function BatchReport({ claims }: BatchReportProps) {
  const isImageFile = (fileType: string, fileName: string) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    return imageTypes.includes(fileType.toLowerCase()) || 
           imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportHTML = () => {
    const reportContent = document.getElementById('batch-report-content')?.innerHTML
    if (!reportContent) return

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Batch Expense Claims Report</title>
    <style>
        ${getBatchReportStyles()}
    </style>
</head>
<body>
    <div class="report-container">
        ${reportContent}
    </div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Batch_Expense_Claims_Report_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getBatchReportStyles = () => `
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
    .report-container { max-width: 1200px; margin: 0 auto; }
    .report-header { text-align: center; border: 2px solid black; padding: 20px; margin-bottom: 30px; }
    .report-section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px; }
    .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .summary-table th, .summary-table td { border: 1px solid #333; padding: 8px; text-align: left; }
    .summary-table th { background-color: #f5f5f5; font-weight: bold; }
    .claim-section { margin-bottom: 50px; border: 1px solid #ddd; padding: 20px; }
    .page-break { page-break-before: always; }
    @media print { 
      body { margin: 0; padding: 15px; }
      .no-print { display: none !important; }
    }
  `

  const totalAmount = claims.reduce((sum, claimData) => sum + parseFloat(claimData.claim.totalAmount), 0)
  const totalItems = claims.reduce((sum, claimData) => sum + claimData.items.length, 0)

  return (
    <>
      {/* 操作按钮 - 不打印 */}
      <div className="no-print bg-gray-100 p-4 mb-6 border-b print:hidden">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Batch Expense Claims Report</h1>
          <div className="flex gap-4">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              🖨️ Print Report
            </button>
            <button
              onClick={handleExportHTML}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
            >
              📄 Export HTML
            </button>
          </div>
        </div>
      </div>

      {/* 报表内容 */}
      <div id="batch-report-content" className="max-w-6xl mx-auto bg-white p-8">
        {/* 报表头部 */}
        <div className="text-center border-2 border-black p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">Wild Dynasty Pte Ltd</h1>
          <h2 className="text-lg">Batch Expense Claims Audit Report</h2>
          <p className="text-sm text-gray-600 mt-2">
            Generated on: {new Date().toLocaleDateString('en-SG')} at {new Date().toLocaleTimeString('en-SG')}
          </p>
          <p className="text-sm text-gray-600">
            Total Claims: {claims.length} | Total Amount: SGD {totalAmount.toFixed(2)}
          </p>
        </div>

        {/* 汇总表 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b border-black pb-2">Claims Summary</h3>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-3 text-left font-bold">Claim ID</th>
                <th className="border border-black p-3 text-left font-bold">Employee</th>
                <th className="border border-black p-3 text-left font-bold">Department</th>
                <th className="border border-black p-3 text-left font-bold">Date</th>
                <th className="border border-black p-3 text-left font-bold">Items</th>
                <th className="border border-black p-3 text-left font-bold">Amount (SGD)</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claimData) => (
                <tr key={claimData.claim.id}>
                  <td className="border border-black p-3">CL-2024-{claimData.claim.id.toString().padStart(4, '0')}</td>
                  <td className="border border-black p-3">
                    {claimData.employee.name}
                    <br />
                    <span className="text-sm text-gray-600">EMP{claimData.employee.employeeCode.toString().padStart(3, '0')}</span>
                  </td>
                  <td className="border border-black p-3">{claimData.employee.department || 'N/A'}</td>
                  <td className="border border-black p-3">
                    {claimData.claim.createdAt ? new Date(claimData.claim.createdAt).toLocaleDateString('en-SG') : 'N/A'}
                  </td>
                  <td className="border border-black p-3 text-center">{claimData.items.length}</td>
                  <td className="border border-black p-3 text-right font-medium">{parseFloat(claimData.claim.totalAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={4} className="border border-black p-3 text-right font-bold">Total:</td>
                <td className="border border-black p-3 text-center font-bold">{totalItems}</td>
                <td className="border border-black p-3 text-right font-bold text-lg">SGD {totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 详细申请报告 */}
        <div>
          <h3 className="text-lg font-bold mb-6 border-b border-black pb-2">Detailed Claims</h3>
          
          {claims.map((claimData, index) => (
            <div key={claimData.claim.id} className={`mb-12 ${index > 0 ? 'page-break' : ''}`}>
              <div className="border-2 border-gray-400 p-6">
                {/* 单个申请头部 */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
                  <div>
                    <h4 className="text-xl font-bold">Claim CL-2024-{claimData.claim.id.toString().padStart(4, '0')}</h4>
                    <p className="text-gray-600">{claimData.employee.name} (EMP{claimData.employee.employeeCode.toString().padStart(3, '0')})</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">SGD {parseFloat(claimData.claim.totalAmount).toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{claimData.items.length} items</div>
                  </div>
                </div>

                {/* 费用明细 */}
                <table className="w-full border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left text-sm font-bold">Date</th>
                      <th className="border border-gray-300 p-2 text-left text-sm font-bold">Type</th>
                      <th className="border border-gray-300 p-2 text-left text-sm font-bold">Description</th>
                      <th className="border border-gray-300 p-2 text-left text-sm font-bold">Currency</th>
                      <th className="border border-gray-300 p-2 text-left text-sm font-bold">Amount</th>
                      <th className="border border-gray-300 p-2 text-left text-sm font-bold">SGD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 p-2 text-sm">{item.date ? new Date(item.date).toLocaleDateString('en-SG') : 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-sm">{item.itemTypeNo}</td>
                        <td className="border border-gray-300 p-2 text-sm">{item.note || 'N/A'}</td>
                        <td className="border border-gray-300 p-2 text-sm">{item.currencyCode}</td>
                        <td className="border border-gray-300 p-2 text-sm text-right">{parseFloat(item.amount).toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 text-sm text-right font-medium">{parseFloat(item.sgdAmount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 支持文档（仅显示图片，节省空间） */}
                {((claimData.attachments && claimData.attachments.some(att => isImageFile(att.fileType, att.fileName))) ||
                  claimData.items.some(item => item.attachments && item.attachments.some(att => isImageFile(att.fileType, att.fileName)))) && (
                  <div className="mb-4">
                    <h5 className="font-bold mb-3 text-sm">Supporting Images:</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Claim级别的图片 */}
                      {(claimData.attachments || [])
                        .filter(att => isImageFile(att.fileType, att.fileName))
                        .map((attachment) => (
                          <div key={attachment.id} className="text-center">
                            <img
                              src={attachment.url}
                              alt={attachment.fileName}
                              className="w-full h-32 object-cover border border-gray-300 rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                            <div className="text-xs text-gray-500 mt-1 truncate" title={attachment.fileName}>
                              {attachment.fileName}
                            </div>
                          </div>
                        ))}
                      
                      {/* Item级别的图片 */}
                      {claimData.items.map((item) =>
                        item.attachments && item.attachments
                          .filter(att => isImageFile(att.fileType, att.fileName))
                          .map((attachment) => (
                            <div key={attachment.id} className="text-center">
                              <img
                                src={attachment.url}
                                alt={attachment.fileName}
                                className="w-full h-32 object-cover border border-gray-300 rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                              <div className="text-xs text-gray-500 mt-1 truncate" title={attachment.fileName}>
                                {attachment.fileName}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* Admin notes */}
                {claimData.claim.adminNotes && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200">
                    <div className="font-bold text-sm">Admin Notes:</div>
                    <div className="text-sm">{claimData.claim.adminNotes}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 批量审核签名区域 */}
        <div className="mt-16 page-break">
          <h3 className="text-lg font-bold mb-6 border-b border-black pb-2">Batch Audit Review</h3>
          <div className="grid grid-cols-1 gap-8">
            <div>
              <div className="mb-4">
                <span className="font-bold">Total Claims Reviewed:</span> {claims.length}
              </div>
              <div className="mb-4">
                <span className="font-bold">Total Amount Approved:</span> SGD {totalAmount.toFixed(2)}
              </div>
              <div className="mb-4">
                <span className="font-bold">Review Date:</span> _________________
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-12 mt-8">
            <div>
              <div className="mb-2 font-medium">Finance Manager Review:</div>
              <div className="border border-black h-20 mb-2"></div>
              <div className="text-sm">Signature: __________________ Date: __________</div>
              <div className="text-sm mt-2">Print Name: _________________________</div>
            </div>
            <div>
              <div className="mb-2 font-medium">Accounting Department:</div>
              <div className="border border-black h-20 mb-2"></div>
              <div className="text-sm">Signature: __________________ Date: __________</div>
              <div className="text-sm mt-2">Print Name: _________________________</div>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Wild Dynasty Pte Ltd - Batch Expense Claims Audit Report</p>
          <p>This report contains {claims.length} approved expense claims totaling SGD {totalAmount.toFixed(2)}.</p>
          <p>Generated for internal audit and accounting review purposes only.</p>
        </div>
      </div>
    </>
  )
}