'use client'

import { useState } from 'react'
import { formatClaimId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Printer, FileDown, Image, FileText, Receipt, Calendar, DollarSign } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic import for client-side only component
const PdfPreview = dynamic(() => import('@/components/ui/pdf-preview'), {
  ssr: false,
  loading: () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-center mb-3">
        <FileText className="h-12 w-12 text-red-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">Loading PDF preview...</p>
      </div>
    </div>
  )
})

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

  const isPdfFile = (fileType: string, fileName: string) => {
    return fileType.toLowerCase() === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
  }

  const renderFilePreview = (attachment: any) => {
    if (isImageFile(attachment.fileType, attachment.fileName)) {
      return (
        <div className="p-3">
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="attachment-preview w-full max-h-64 object-contain bg-white rounded border"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const fallback = document.createElement('div')
              fallback.className = 'p-4 bg-gray-200 text-center text-sm text-gray-500 rounded'
              fallback.textContent = 'Preview not available'
              target.parentNode?.appendChild(fallback)
            }}
          />
        </div>
      )
    } else if (isPdfFile(attachment.fileType, attachment.fileName)) {
      return (
        <div className="p-3">
          <PdfPreview
            url={attachment.url}
            fileName={attachment.fileName}
            maxPages={3}
          />
        </div>
      )
    } else {
      return (
        <div className="p-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-3">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 mb-2">Document</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open(attachment.url, '_blank')}
              >
                <FileText className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )
    }
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
    .item-card { border: 1px solid #ddd; margin-bottom: 20px; page-break-inside: avoid; }
    .item-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
    .item-content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
    .item-details { }
    .item-attachments { }
    .attachment-preview { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
    .signature-section { margin-top: 50px; }
    .signature-box { border: 1px solid #333; height: 60px; margin-bottom: 10px; }
    @media print {
      body { margin: 0; padding: 15px; font-size: 12px; }
      .no-print { display: none !important; }
      .item-card {
        page-break-inside: avoid;
        margin-bottom: 30px;
        border: 1px solid #333 !important;
      }
      .item-header {
        background: #f0f0f0 !important;
        -webkit-print-color-adjust: exact;
      }
      .item-content {
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        padding: 15px;
      }
      .attachment-preview {
        max-height: 200px !important;
      }
      /* Ensure card content stays together */
      .item-details, .item-attachments {
        break-inside: avoid;
      }
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

          {/* Expense Items - Card Layout */}
          <div className="p-8 border-b border-gray-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Expense Details</h3>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-green-600 font-mono">
                  SGD {parseFloat(claim.totalAmount).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {items.map((item, index) => (
                <Card key={item.id} className="item-card border-2 border-gray-200 shadow-sm">
                  {/* Item Header */}
                  <div className="item-header bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {item.itemTypeNo} - {item.itemTypeName}
                          </h4>
                          <p className="text-sm text-gray-600">{item.note || 'No description'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 font-mono">
                          SGD {parseFloat(item.sgdAmount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.currencyCode} {parseFloat(item.amount).toFixed(2)} × {parseFloat(item.rate).toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Item Content */}
                  <div className="item-content grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Left: Item Details */}
                    <div className="item-details space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Date:</span>
                          <span className="text-sm">
                            {item.date ? new Date(item.date).toLocaleDateString('en-SG') : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Receipt className="h-4 w-4 text-gray-500 mt-0.5" />
                          <span className="text-sm font-medium text-gray-600">Evidence No:</span>
                          <span className="text-sm">{item.evidenceNo || 'N/A'}</span>
                        </div>

                        {item.details && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                            <span className="text-sm font-medium text-gray-600">Details:</span>
                            <span className="text-sm">{item.details}</span>
                          </div>
                        )}

                        <div className="bg-gray-50 p-3 rounded">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Original Currency:</span>
                              <div className="font-mono">{item.currencyCode} {parseFloat(item.amount).toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Exchange Rate:</span>
                              <div className="font-mono">{parseFloat(item.rate).toFixed(4)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Attachments */}
                    <div className="item-attachments">
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Supporting Documents
                      </h5>

                      {item.attachments && item.attachments.length > 0 ? (
                        <div className="space-y-3">
                          {item.attachments.map((attachment) => (
                            <div key={attachment.id} className="border rounded-lg overflow-hidden bg-gray-50">
                              <div className="p-3 border-b bg-white">
                                <div className="flex items-center gap-2">
                                  {isImageFile(attachment.fileType, attachment.fileName) ? (
                                    <Image className="h-4 w-4 text-blue-500" />
                                  ) : isPdfFile(attachment.fileType, attachment.fileName) ? (
                                    <FileText className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span className="text-sm font-medium truncate">{attachment.fileName}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {Math.round(parseFloat(attachment.fileSize) / 1024)} KB
                                </div>
                              </div>

                              {renderFilePreview(attachment)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No supporting documents</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* General Attachments (Claim-level) */}
          {attachments && attachments.length > 0 && (
            <div className="p-8 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Attachments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="border rounded-lg overflow-hidden bg-gray-50">
                    <div className="p-3 border-b bg-white">
                      <div className="flex items-center gap-2">
                        {isImageFile(attachment.fileType, attachment.fileName) ? (
                          <Image className="h-4 w-4 text-blue-500" />
                        ) : isPdfFile(attachment.fileType, attachment.fileName) ? (
                          <FileText className="h-4 w-4 text-red-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium truncate">{attachment.fileName}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(parseFloat(attachment.fileSize) / 1024)} KB
                      </div>
                    </div>
                    {renderFilePreview(attachment)}
                  </div>
                ))}
              </div>
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