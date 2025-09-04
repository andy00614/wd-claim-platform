'use client'

import { useState } from 'react'

interface ClaimReportProps {
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
    note: string
    details: string
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
  }>
  employee: {
    name: string
    employeeCode: number
    department?: string
  }
}

export default function ClaimReport({ claim, items, attachments, employee }: ClaimReportProps) {
  const [showPrintView, setShowPrintView] = useState(false)

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
    const reportContent = document.getElementById('report-content')?.innerHTML
    if (!reportContent) return

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Claim Report - CL-2024-${claim.id.toString().padStart(4, '0')}</title>
    <style>
        ${getReportStyles()}
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
    link.download = `Expense_Claim_Report_CL-2024-${claim.id.toString().padStart(4, '0')}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getReportStyles = () => `
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
    .report-container { max-width: 1200px; margin: 0 auto; }
    .report-header { text-align: center; border: 2px solid black; padding: 20px; margin-bottom: 30px; }
    .report-section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
    .info-item { margin-bottom: 8px; }
    .info-label { font-weight: bold; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th, .items-table td { border: 1px solid #333; padding: 8px; text-align: left; }
    .items-table th { background-color: #f5f5f5; font-weight: bold; }
    .attachment-image { max-width: 300px; max-height: 200px; border: 1px solid #ddd; margin: 10px 0; }
    .signature-section { margin-top: 50px; }
    .signature-box { border: 1px solid #333; height: 60px; margin-bottom: 10px; }
    @media print { 
      body { margin: 0; padding: 15px; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  `

  return (
    <>
      {/* 操作按钮 - 不打印 */}
      <div className="no-print bg-gray-100 p-4 mb-6 border-b print:hidden">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Expense Claim Report</h1>
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
      <div id="report-content" className="max-w-6xl mx-auto bg-white p-8">
        {/* 报表头部 */}
        <div className="text-center border-2 border-black p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">Wild Dynasty Pte Ltd</h1>
          <h2 className="text-lg">Expense Claim Audit Report</h2>
          <p className="text-sm text-gray-600 mt-2">
            Generated on: {new Date().toLocaleDateString('en-SG')} at {new Date().toLocaleTimeString('en-SG')}
          </p>
        </div>

        {/* 基本信息 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b border-black pb-2">Claim Information</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="mb-2"><span className="font-bold">Claim ID:</span> CL-2024-{claim.id.toString().padStart(4, '0')}</div>
              <div className="mb-2"><span className="font-bold">Employee:</span> {employee.name}</div>
              <div className="mb-2"><span className="font-bold">Employee Code:</span> EMP{employee.employeeCode.toString().padStart(3, '0')}</div>
              {employee.department && (
                <div className="mb-2"><span className="font-bold">Department:</span> {employee.department}</div>
              )}
            </div>
            <div>
              <div className="mb-2"><span className="font-bold">Submission Date:</span> {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-SG') : 'N/A'}</div>
              <div className="mb-2"><span className="font-bold">Status:</span> <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">APPROVED</span></div>
              <div className="mb-2"><span className="font-bold">Total Amount:</span> <span className="text-xl font-bold">SGD {parseFloat(claim.totalAmount).toFixed(2)}</span></div>
              {claim.adminNotes && (
                <div className="mb-2"><span className="font-bold">Admin Notes:</span> {claim.adminNotes}</div>
              )}
            </div>
          </div>
        </div>

        {/* 费用明细 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 border-b border-black pb-2">Expense Details</h3>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-3 text-left font-bold">Date</th>
                <th className="border border-black p-3 text-left font-bold">Item Type</th>
                <th className="border border-black p-3 text-left font-bold">Description</th>
                <th className="border border-black p-3 text-left font-bold">Details</th>
                <th className="border border-black p-3 text-left font-bold">Currency</th>
                <th className="border border-black p-3 text-left font-bold">Amount</th>
                <th className="border border-black p-3 text-left font-bold">Rate</th>
                <th className="border border-black p-3 text-left font-bold">SGD Amount</th>
                <th className="border border-black p-3 text-left font-bold">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-black p-3">{item.date ? new Date(item.date).toLocaleDateString('en-SG') : 'N/A'}</td>
                  <td className="border border-black p-3">{item.itemTypeNo} - {item.itemTypeName}</td>
                  <td className="border border-black p-3">{item.note}</td>
                  <td className="border border-black p-3 text-sm">{item.details}</td>
                  <td className="border border-black p-3">{item.currencyCode}</td>
                  <td className="border border-black p-3 text-right">{parseFloat(item.amount).toFixed(2)}</td>
                  <td className="border border-black p-3 text-right">{parseFloat(item.rate).toFixed(4)}</td>
                  <td className="border border-black p-3 text-right font-medium">{parseFloat(item.sgdAmount).toFixed(2)}</td>
                  <td className="border border-black p-3">{item.evidenceNo || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={7} className="border border-black p-3 text-right font-bold">Total:</td>
                <td className="border border-black p-3 text-right font-bold text-lg">SGD {parseFloat(claim.totalAmount).toFixed(2)}</td>
                <td className="border border-black p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 支持文档 */}
        {(attachments.length > 0 || items.some(item => item.attachments && item.attachments.length > 0)) && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 border-b border-black pb-2">Supporting Documents</h3>
            
            {/* Claim级别的附件 */}
            {attachments.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">General Attachments:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="border border-gray-300 p-3">
                      <div className="font-medium text-sm mb-2">{attachment.fileName}</div>
                      <div className="text-xs text-gray-500 mb-2">
                        {attachment.fileType} • {Math.round(parseFloat(attachment.fileSize) / 1024)} KB
                      </div>
                      {isImageFile(attachment.fileType, attachment.fileName) ? (
                        <img
                          src={attachment.url}
                          alt={attachment.fileName}
                          className="max-w-full max-h-48 border border-gray-300 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const fallback = document.createElement('div')
                            fallback.className = 'p-4 bg-gray-100 text-center text-sm text-gray-500'
                            fallback.textContent = 'Image not available'
                            target.parentNode?.appendChild(fallback)
                          }}
                        />
                      ) : (
                        <div className="p-4 bg-gray-100 text-center">
                          <span className="text-sm">📄 {attachment.fileName}</span>
                          <div className="text-xs text-gray-500">Preview not available</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item级别的附件 */}
            {items.some(item => item.attachments && item.attachments.length > 0) && (
              <div>
                <h4 className="font-medium mb-3">Item-specific Attachments:</h4>
                {items.map((item, itemIndex) => (
                  item.attachments && item.attachments.length > 0 && (
                    <div key={item.id} className="mb-6 border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium mb-2">
                        Item #{itemIndex + 1}: {item.note} (SGD {parseFloat(item.sgdAmount).toFixed(2)})
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        {item.attachments.map((attachment) => (
                          <div key={attachment.id} className="border border-gray-300 p-3">
                            <div className="font-medium text-sm mb-2">{attachment.fileName}</div>
                            <div className="text-xs text-gray-500 mb-2">
                              {attachment.fileType} • {Math.round(parseFloat(attachment.fileSize) / 1024)} KB
                            </div>
                            {isImageFile(attachment.fileType, attachment.fileName) ? (
                              <img
                                src={attachment.url}
                                alt={attachment.fileName}
                                className="max-w-full max-h-48 border border-gray-300 rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const fallback = document.createElement('div')
                                  fallback.className = 'p-4 bg-gray-100 text-center text-sm text-gray-500'
                                  fallback.textContent = 'Image not available'
                                  target.parentNode?.appendChild(fallback)
                                }}
                              />
                            ) : (
                              <div className="p-4 bg-gray-100 text-center">
                                <span className="text-sm">📄 {attachment.fileName}</span>
                                <div className="text-xs text-gray-500">Preview not available</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* 审核签名区域 */}
        <div className="mt-16">
          <h3 className="text-lg font-bold mb-6 border-b border-black pb-2">Audit Review</h3>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="mb-2 font-medium">Finance Manager Review:</div>
              <div className="border border-black h-16 mb-2"></div>
              <div className="text-sm">Signature: __________________ Date: __________</div>
            </div>
            <div>
              <div className="mb-2 font-medium">Accounting Department:</div>
              <div className="border border-black h-16 mb-2"></div>
              <div className="text-sm">Signature: __________________ Date: __________</div>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Wild Dynasty Pte Ltd - Expense Claim Audit Report</p>
          <p>This report is generated for internal audit purposes only. All amounts are in Singapore Dollars (SGD).</p>
        </div>
      </div>
    </>
  )
}