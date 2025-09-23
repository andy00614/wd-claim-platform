'use client'

import { Fragment, useMemo, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { formatClaimId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import { ArrowLeft, Printer, FileDown, Image, FileText } from 'lucide-react'

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

type Attachment = {
  id: number
  fileName: string
  url: string
  fileType: string
  fileSize: string
  claimId?: number | null
  claimItemId?: number | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

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
    attachments?: Attachment[]
  }>
  attachments: Attachment[] | undefined
  employee: {
    name: string
    employeeCode: number
    department?: string
  }
}

const parseToDate = (value: Date | string | null | undefined) => {
  if (!value) return null
  const dateObj = value instanceof Date ? value : new Date(value)
  return Number.isNaN(dateObj.getTime()) ? null : dateObj
}

const formatDateValue = (value: Date | string | null | undefined, dateFormat = 'dd/MM/yyyy') => {
  const parsed = parseToDate(value)
  return parsed ? format(parsed, dateFormat) : ''
}

const formatFileSize = (value?: string | null) => {
  if (!value) return ''
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    return value
  }
  if (parsed >= 1024 * 1024) {
    return `${(parsed / (1024 * 1024)).toFixed(2)} MB`
  }
  if (parsed >= 1024) {
    return `${Math.round(parsed / 1024)} KB`
  }
  return `${Math.max(parsed, 0).toFixed(0)} B`
}

const toDateInputValue = (value: Date | string | null | undefined) => {
  const parsed = parseToDate(value)
  return parsed ? format(parsed, 'yyyy-MM-dd') : ''
}

type EditableRow = {
  contactName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  description: string
  quantity: string
  unitAmount: string
  accountCode: string
  taxType: string
  currency: string
}

export default function ClaimReportV2({ claim, items, attachments, employee }: ClaimReportProps) {
  const [editableRows, setEditableRows] = useState<EditableRow[]>([])

  useEffect(() => {
    const nextRows: EditableRow[] = items.map((item) => ({
      contactName: employee.name ?? '',
      invoiceNumber: item.evidenceNo || formatClaimId(claim.id),
      invoiceDate: toDateInputValue(item.date),
      dueDate: toDateInputValue(item.date),
      description: item.details || item.note || item.itemTypeName,
      quantity: '1',
      unitAmount: item.sgdAmount ? Number.parseFloat(item.sgdAmount).toFixed(2) : '',
      accountCode: item.itemTypeNo,
      taxType: 'No Tax',
      currency: item.currencyCode,
    }))

    setEditableRows(nextRows)
  }, [items, employee.name, claim.id])

  const totalSgdAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const parsed = Number.parseFloat(item.sgdAmount || '0')
      return Number.isNaN(parsed) ? sum : sum + parsed
    }, 0)
  }, [items])

  // Collect all attachments with their context
  const allAttachmentsWithContext = useMemo(() => {
    const attachmentsList: Array<{
      attachment: Attachment
      itemIndex: number | null
      itemName: string | null
    }> = []

    // Add item-level attachments
    items.forEach((item, index) => {
      const itemAttachments: Attachment[] = []

      // From item.attachments
      if (item.attachments && item.attachments.length > 0) {
        itemAttachments.push(...item.attachments)
      }

      // From global attachments with matching claimItemId
      if (attachments && attachments.length > 0) {
        attachments.forEach((attachment) => {
          if (attachment.claimItemId === item.id && !itemAttachments.some((existing) => existing.id === attachment.id)) {
            itemAttachments.push(attachment)
          }
        })
      }

      // Add each attachment with context
      itemAttachments.forEach(attachment => {
        attachmentsList.push({
          attachment,
          itemIndex: index + 1,
          itemName: `${item.itemTypeNo} - ${item.itemTypeName}`
        })
      })
    })

    // Add claim-level attachments
    if (attachments && attachments.length > 0) {
      const claimLevelAttachments = attachments.filter((attachment) => !attachment.claimItemId)
      claimLevelAttachments.forEach(attachment => {
        attachmentsList.push({
          attachment,
          itemIndex: null,
          itemName: null
        })
      })
    }

    return attachmentsList
  }, [attachments, items])

  const attachmentCount = allAttachmentsWithContext.length

  const statusLabel = claim.status ? `${claim.status.charAt(0).toUpperCase()}${claim.status.slice(1)}` : '—'
  const postingDateDisplay = formatDateValue(claim.createdAt) || 'dd/mm/yyyy'
  const claimedAmountDisplay = totalSgdAmount.toFixed(2)

  const isImageFile = (fileType: string, fileName: string) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

    return imageTypes.includes(fileType.toLowerCase()) ||
      imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
  }

  const isPdfFile = (fileType: string, fileName: string) => {
    return fileType.toLowerCase() === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
  }

  const handleRowChange = (index: number, field: keyof EditableRow, value: string) => {
    setEditableRows((prev) => prev.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row
      }
      return {
        ...row,
        [field]: value,
      }
    }))
  }

  const editableColumns: Array<{ key: keyof EditableRow; label: string }> = [
    { key: 'contactName', label: '*ContactName' },
    { key: 'invoiceNumber', label: '*InvoiceNumber' },
    { key: 'invoiceDate', label: '*InvoiceDate' },
    { key: 'dueDate', label: '*DueDate' },
    { key: 'description', label: 'Description' },
    { key: 'quantity', label: '*Quantity' },
    { key: 'unitAmount', label: '*UnitAmount' },
    { key: 'accountCode', label: '*AccountCode' },
    { key: 'taxType', label: '*TaxType' },
    { key: 'currency', label: 'Currency' },
  ]

  const dateFields: Array<keyof EditableRow> = ['invoiceDate', 'dueDate']
  const numericFields: Array<keyof EditableRow> = ['quantity', 'unitAmount']

  const renderFilePreview = (attachment: any) => {
    if (isImageFile(attachment.fileType, attachment.fileName)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="max-w-full max-h-[85vh] object-contain mx-auto"
          onError={(event) => {
            const target = event.target as HTMLImageElement
            target.style.display = 'none'
            const fallback = document.createElement('div')
            fallback.className = 'p-4 bg-gray-200 text-center text-sm text-gray-500 rounded'
            fallback.textContent = 'Preview not available'
            target.parentNode?.appendChild(fallback)
          }}
        />
      )
    }

    if (isPdfFile(attachment.fileType, attachment.fileName)) {
      return (
        <div className="max-h-[85vh] overflow-auto">
          <PdfPreview
            url={attachment.url}
            fileName={attachment.fileName}
            maxPages={10}
          />
        </div>
      )
    }

    return (
      <div className="p-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-16 w-16 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-3">Document</p>
            <p className="text-sm text-gray-600 mb-4">{attachment.fileName}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(attachment.url, '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportHTML = () => {
    const reportContent = document.getElementById('report-content-v2')?.innerHTML
    if (!reportContent) return

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expense Claim Report V2 - ${formatClaimId(claim.id)}</title>
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
    link.download = `Expense_Claim_Report_V2_${formatClaimId(claim.id)}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getReportStyles = () => `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      background: #ffffff;
      color: #111827;
    }

    .report-container {
      width: 100%;
    }

    /* Summary Table Styles */
    .summary-page {
      padding: 40px;
      min-height: 100vh;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }

    .summary-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px double #000;
      padding-bottom: 20px;
    }

    .summary-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 15px;
      letter-spacing: 1px;
    }

    .summary-meta {
      display: flex;
      justify-content: center;
      gap: 30px;
      font-size: 14px;
      margin-top: 15px;
      flex-wrap: wrap;
    }

    .summary-meta-item {
      display: flex;
      gap: 8px;
    }

    .summary-meta-label {
      font-weight: 600;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .summary-table th {
      background: #f3f4f6;
      font-weight: 600;
      text-align: left;
      padding: 12px;
      border: 1px solid #000;
      font-size: 13px;
      text-transform: uppercase;
    }

    .summary-table td {
      padding: 10px 12px;
      border: 1px solid #000;
      font-size: 13px;
    }

    .summary-table .item-number {
      font-weight: 600;
      text-align: center;
    }

    .summary-table .amount-cell {
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }

    .summary-table .description-row td {
      font-size: 12px;
      color: #4b5563;
      padding-top: 0;
      border-top: none;
    }

    .summary-table .total-row {
      background: #f3f4f6;
      font-weight: bold;
    }

    .summary-table .total-row td {
      padding: 14px 12px;
      font-size: 15px;
    }

    .summary-footer {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid #d1d5db;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }

    .summary-footer p {
      margin: 5px 0;
    }

    .summary-footer .footer-italic {
      font-style: italic;
      margin-top: 10px;
    }

    /* Attachment Page Styles */
    .attachment-page {
      min-height: 100vh;
      padding: 40px;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }

    .attachment-header {
      border: 2px solid #000;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 30px;
      background: #f9fafb;
    }

    .attachment-header-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .attachment-header-meta {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #4b5563;
      flex-wrap: wrap;
    }

    .attachment-header-meta-item {
      display: flex;
      gap: 6px;
    }

    .attachment-header-meta-label {
      font-weight: 600;
    }

    .attachment-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .attachment-content img {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
    }

    /* Editable Table Styles */
    .editable-table-page {
      min-height: 100vh;
      padding: 40px;
      background: #ffffff;
    }

    .editable-table-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    }

    .editable-table-wrapper {
      overflow-x: auto;
    }

    .editable-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1200px;
    }

    .editable-table th {
      background: #f3f4f6;
      font-weight: 600;
      font-size: 12px;
      padding: 8px;
      border: 1px solid #000;
      text-align: left;
    }

    .editable-table td {
      border: 1px solid #000;
      padding: 0;
    }

    .editable-input {
      width: 100%;
      padding: 8px;
      border: none;
      font-size: 12px;
      box-sizing: border-box;
      background: transparent;
    }

    .editable-input:focus {
      outline: 2px solid #2563eb;
      outline-offset: -2px;
    }

    /* Print Specific Styles */
    @media print {
      .no-print {
        display: none !important;
      }

      .summary-page {
        page-break-after: always;
      }

      .attachment-page {
        page-break-before: always;
        page-break-after: always;
      }

      .attachment-page:last-child {
        page-break-after: auto;
      }

      .editable-table-page {
        page-break-before: always;
      }

      @page {
        size: A4;
        margin: 15mm;
      }
    }

    @media screen {
      .print-only {
        display: none;
      }
    }
  `

  return (
    <>
      {/* Screen View - Control Panel */}
      <div className="no-print bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Expense Claim Report V2</h1>
              <p className="text-sm text-slate-500">
                {formatClaimId(claim.id)} • {attachmentCount} attachments • Optimized for printing
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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

      {/* Screen View - Preview */}
      <div className="no-print max-w-5xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Print Preview:</strong> This report will print with a summary table on the first page,
            followed by each attachment on a separate page. Use the Print button to see the actual print layout.
          </p>
        </div>

        <div className="border border-slate-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Summary Table Preview</h2>
          <p className="text-sm text-slate-600 mb-4">
            The following table will appear on page 1 when printed:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm">Item</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm">Date</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm">Type & Description</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm">Original</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm">Rate</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm">SGD Amount</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-sm">Doc</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const itemAttachmentCount = allAttachmentsWithContext.filter(
                    a => a.itemIndex === index + 1
                  ).length

                  return (
                    <Fragment key={item.id}>
                      <tr>
                        <td rowSpan={2} className="border border-slate-300 px-3 py-2 text-center text-sm font-semibold">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td rowSpan={2} className="border border-slate-300 px-3 py-2 text-sm">
                          {formatDateValue(item.date, 'dd/MM/yyyy')}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-sm">
                          [{item.itemTypeNo}] {item.itemTypeName}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-sm font-mono">
                          {item.currencyCode} {Number.parseFloat(item.amount || '0').toFixed(2)}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-sm text-center">
                          {Number.parseFloat(item.rate || '0').toFixed(4)}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-sm font-mono text-right">
                          {Number.parseFloat(item.sgdAmount || '0').toFixed(2)}
                        </td>
                        <td rowSpan={2} className="border border-slate-300 px-3 py-2 text-center text-sm">
                          {itemAttachmentCount > 0 ? `✓ ${itemAttachmentCount}` : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="border border-slate-300 px-3 py-2 text-xs text-slate-600">
                          {item.note || item.details || '—'}
                        </td>
                      </tr>
                    </Fragment>
                  )
                })}
                <tr className="bg-slate-100 font-semibold">
                  <td colSpan={5} className="border border-slate-300 px-3 py-3 text-right">TOTAL:</td>
                  <td className="border border-slate-300 px-3 py-3 text-right font-mono">
                    SGD {claimedAmountDisplay}
                  </td>
                  <td className="border border-slate-300 px-3 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Print View */}
      <div id="report-content-v2" className="print-only">
        {/* Page 1: Summary Table */}
        {/* <div className="summary-page">
          <div className="summary-header">
            <h1 className="summary-title">ITEMISED EXPENSE BREAKDOWN</h1>
            <div className="summary-meta">
              <div className="summary-meta-item">
                <span className="summary-meta-label">Claim ID:</span>
                <span>{formatClaimId(claim.id)}</span>
              </div>
              <div className="summary-meta-item">
                <span className="summary-meta-label">Employee:</span>
                <span>{employee.name}</span>
              </div>
              <div className="summary-meta-item">
                <span className="summary-meta-label">Status:</span>
                <span className="capitalize">{statusLabel}</span>
              </div>
              <div className="summary-meta-item">
                <span className="summary-meta-label">Total:</span>
                <span className="font-mono font-bold">SGD {claimedAmountDisplay}</span>
              </div>
            </div>
          </div>

          <table className="summary-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Item</th>
                <th style={{ width: '100px' }}>Date</th>
                <th style={{ width: 'auto' }}>Type & Description</th>
                <th style={{ width: '120px' }}>Original</th>
                <th style={{ width: '80px' }}>Rate</th>
                <th style={{ width: '120px' }}>SGD Amount</th>
                <th style={{ width: '60px' }}>Doc</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const itemAttachmentCount = allAttachmentsWithContext.filter(
                  a => a.itemIndex === index + 1
                ).length

                return (
                  <Fragment key={item.id}>
                    <tr>
                      <td rowSpan={2} className="item-number">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td rowSpan={2}>{formatDateValue(item.date, 'dd/MM/yyyy')}</td>
                      <td>[{item.itemTypeNo}] {item.itemTypeName}</td>
                      <td className="amount-cell">
                        {item.currencyCode} {Number.parseFloat(item.amount || '0').toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {Number.parseFloat(item.rate || '0').toFixed(4)}
                      </td>
                      <td className="amount-cell">
                        {Number.parseFloat(item.sgdAmount || '0').toFixed(2)}
                      </td>
                      <td rowSpan={2} style={{ textAlign: 'center' }}>
                        {itemAttachmentCount > 0 ? `✓ ${itemAttachmentCount}` : '—'}
                      </td>
                    </tr>
                    <tr className="description-row">
                      <td colSpan={4} style={{ paddingLeft: '20px' }}>
                        {item.note || item.details || '—'}
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
              <tr className="total-row">
                <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL:</td>
                <td className="amount-cell">SGD {claimedAmountDisplay}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div className="summary-footer">
            <p>Employee Code: {employee.employeeCode} | Department: {employee.department || 'N/A'}</p>
            <p>Posting Date: {postingDateDisplay}</p>
            <p className="footer-italic">
              All amounts are in SGD. Exchange rates as of transaction date.
            </p>
          </div>
        </div> */}

        {/* Subsequent Pages: Each Attachment */}
        {allAttachmentsWithContext.map(({ attachment, itemIndex, itemName }, idx) => (
          <div key={attachment.id} className="attachment-page">
            <div className="attachment-header">
              <div className="attachment-header-title">
                Attachment {idx + 1} of {attachmentCount}
              </div>
              <div className="attachment-header-meta">
                <div className="attachment-header-meta-item">
                  <span className="attachment-header-meta-label">File:</span>
                  <span>{attachment.fileName}</span>
                </div>
                {itemIndex && (
                  <div className="attachment-header-meta-item">
                    <span className="attachment-header-meta-label">Item {String(itemIndex).padStart(2, '0')}:</span>
                    <span>{itemName}</span>
                  </div>
                )}
                <div className="attachment-header-meta-item">
                  <span className="attachment-header-meta-label">Size:</span>
                  <span>{formatFileSize(attachment.fileSize)}</span>
                </div>
              </div>
            </div>
            <div className="attachment-content">
              {renderFilePreview(attachment)}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}