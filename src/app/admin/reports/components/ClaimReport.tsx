'use client'

import { useState } from 'react'
import { formatClaimId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table'
import { ArrowLeft, Printer, FileDown, Image, FileText } from 'lucide-react'

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

export default function ClaimReport({ claim, items, attachments, employee }: ClaimReportProps) {
  const [showPrintView, setShowPrintView] = useState(false)

  const isImageFile = (fileType: string, fileName: string) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    return imageTypes.includes(fileType.toLowerCase()) || 
           imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'submitted':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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
    <title>Expense Claim Report - ${formatClaimId(claim.id)}</title>
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
    link.download = `Expense_Claim_Report_${formatClaimId(claim.id)}.html`
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
    <div className="min-h-screen bg-white">
      {/* 操作按钮 - 不打印 */}
      <div className="no-print bg-white border-b print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Expense Claim Report</h1>
              <p className="text-sm text-gray-600 mt-1">
                {formatClaimId(claim.id)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleExportHTML}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export HTML
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div id="report-content" className="bg-white border-2 border-black print:border-2 print:border-black">
          
          {/* Invoice Header */}
          <div className="p-8 text-center border-b-2 border-black">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Wild Dynasty Pte Ltd</h1>
            <p className="text-lg font-medium text-gray-700 mb-1">Expense Claim Audit Report</p>
            <p className="text-sm text-gray-500">
              Generated on: {new Date().toLocaleDateString('en-SG')} at {new Date().toLocaleTimeString('en-SG')}
            </p>
          </div>

          {/* Claim Information */}
          <div className="p-8 border-b border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Claim ID:</span>
                    <span className="font-mono font-semibold">CL-2024-{claim.id.toString().padStart(4, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Status:</span>
                    {getStatusBadge(claim.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Submission Date:</span>
                    <span>{claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-SG') : 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="font-semibold">{employee.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Employee Code:</span>
                    <span className="font-mono">EMP{employee.employeeCode.toString().padStart(3, '0')}</span>
                  </div>
                  {employee.department && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Department:</span>
                      <span>{employee.department}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {claim.adminNotes && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Admin Notes:</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{claim.adminNotes}</p>
              </div>
            )}
          </div>

          {/* Expense Details Table */}
          <div className="p-8 border-b border-gray-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Details</h3>
            <div className="border border-black">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b border-black">
                    <TableHead className="border-r border-black font-semibold text-black">Date</TableHead>
                    <TableHead className="border-r border-black font-semibold text-black">Item Type</TableHead>
                    <TableHead className="border-r border-black font-semibold text-black">Description</TableHead>
                    <TableHead className="border-r border-black font-semibold text-black">Details</TableHead>
                    <TableHead className="border-r border-black font-semibold text-black">Currency</TableHead>
                    <TableHead className="text-right border-r border-black font-semibold text-black">Amount</TableHead>
                    <TableHead className="text-right border-r border-black font-semibold text-black">Rate</TableHead>
                    <TableHead className="text-right border-r border-black font-semibold text-black">SGD Amount</TableHead>
                    <TableHead className="font-semibold text-black">Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id} className="border-b border-gray-300">
                      <TableCell className="border-r border-gray-300">
                        {item.date ? new Date(item.date).toLocaleDateString('en-SG') : 'N/A'}
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        <div className="font-medium">{item.itemTypeNo} - {item.itemTypeName}</div>
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        {item.note || 'N/A'}
                      </TableCell>
                      <TableCell className="border-r border-gray-300 text-sm">
                        {item.details || 'N/A'}
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        {item.currencyCode}
                      </TableCell>
                      <TableCell className="text-right border-r border-gray-300 font-mono">
                        {parseFloat(item.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right border-r border-gray-300 font-mono">
                        {parseFloat(item.rate).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right border-r border-gray-300 font-mono font-medium">
                        {parseFloat(item.sgdAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {item.evidenceNo || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-gray-100 border-t-2 border-black">
                    <TableCell colSpan={7} className="text-right font-bold text-lg border-r border-black">
                      TOTAL AMOUNT:
                    </TableCell>
                    <TableCell className="text-right font-bold text-xl font-mono border-r border-black">
                      SGD {parseFloat(claim.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>

          {/* Supporting Documents */}
          {((attachments && attachments.length > 0) || items.some(item => item.attachments && item.attachments.length > 0)) && (
            <div className="p-8 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
              
              {/* Claim级别的附件 */}
              {attachments && attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">General Attachments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="border rounded p-3 bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {isImageFile(attachment.fileType, attachment.fileName) ? (
                              <Image className="h-6 w-6 text-blue-500" />
                            ) : (
                              <FileText className="h-6 w-6 text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-900 truncate">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {attachment.fileType} • {Math.round(parseFloat(attachment.fileSize) / 1024)} KB
                            </p>
                          </div>
                        </div>
                        {isImageFile(attachment.fileType, attachment.fileName) && (
                          <div className="mt-2">
                            <img
                              src={attachment.url}
                              alt={attachment.fileName}
                              className="max-w-full max-h-32 rounded border object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = document.createElement('div')
                                fallback.className = 'p-2 bg-gray-200 text-center text-xs text-gray-500 rounded'
                                fallback.textContent = 'Image not available'
                                target.parentNode?.appendChild(fallback)
                              }}
                            />
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
                  <h4 className="font-semibold text-gray-900 mb-3">Item-specific Attachments</h4>
                  <div className="space-y-4">
                    {items.map((item, itemIndex) => (
                      item.attachments && item.attachments.length > 0 && (
                        <div key={item.id} className="border-l-4 border-blue-500 pl-4">
                          <h5 className="font-medium mb-2 text-gray-800">
                            Item #{itemIndex + 1}: {item.note || 'N/A'} 
                            <span className="text-green-600 font-mono ml-2">(SGD {parseFloat(item.sgdAmount).toFixed(2)})</span>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {item.attachments.map((attachment) => (
                              <div key={attachment.id} className="border rounded p-3 bg-gray-50">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    {isImageFile(attachment.fileType, attachment.fileName) ? (
                                      <Image className="h-6 w-6 text-blue-500" />
                                    ) : (
                                      <FileText className="h-6 w-6 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-gray-900 truncate">{attachment.fileName}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {attachment.fileType} • {Math.round(parseFloat(attachment.fileSize) / 1024)} KB
                                    </p>
                                  </div>
                                </div>
                                {isImageFile(attachment.fileType, attachment.fileName) && (
                                  <div className="mt-2">
                                    <img
                                      src={attachment.url}
                                      alt={attachment.fileName}
                                      className="max-w-full max-h-32 rounded border object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        const fallback = document.createElement('div')
                                        fallback.className = 'p-2 bg-gray-200 text-center text-xs text-gray-500 rounded'
                                        fallback.textContent = 'Image not available'
                                        target.parentNode?.appendChild(fallback)
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Review Section */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Audit Review</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Finance Manager Review</h4>
                <div className="border-2 border-dashed border-gray-400 h-20 flex items-center justify-center text-gray-400">
                  Signature Area
                </div>
                <div className="text-sm text-gray-700">
                  Signature: __________________ Date: __________
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Accounting Department</h4>
                <div className="border-2 border-dashed border-gray-400 h-20 flex items-center justify-center text-gray-400">
                  Signature Area
                </div>
                <div className="text-sm text-gray-700">
                  Signature: __________________ Date: __________
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Footer */}
          <div className="p-6 bg-gray-50 border-t-2 border-black text-center">
            <p className="font-semibold text-gray-900">Wild Dynasty Pte Ltd - Expense Claim Audit Report</p>
            <p className="text-sm text-gray-600 mt-1">This report is generated for internal audit purposes only. All amounts are in Singapore Dollars (SGD).</p>
          </div>
        </div>
      </div>
    </div>
  )
}