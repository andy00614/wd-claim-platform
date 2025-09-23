'use client'

import { Fragment, useMemo, useState, useRef } from 'react'
import { format } from 'date-fns'
import { formatClaimId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import dynamic from 'next/dynamic'
import { ArrowLeft, Printer, FileDown, FileText, FileSpreadsheet } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

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
  const [showCsvDialog, setShowCsvDialog] = useState(false)
  const [csvData, setCsvData] = useState<EditableRow[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Expense_Claim_Report_${formatClaimId(claim.id)}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }

      @media print {
        body {
          background: #ffffff !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }

        .no-print {
          display: none !important;
        }

        .summary-page,
        .attachment-page {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          padding: 24px !important;
        }

        /* 确保摘要页面占满一页 */
        .summary-page {
          min-height: calc(100vh - 48px);
          page-break-after: always;
        }

        /* 每个附件页面独占一页 */
        .attachment-page {
          page-break-before: always;
          page-break-after: always;
          min-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
        }

        /* 附件内容区域占满剩余空间 */
        .attachment-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 600px;
        }

        /* PDF 预览占满页面 */
        .attachment-content .pdf-preview-container {
          width: 100% !important;
          height: 100% !important;
          max-height: 600px !important;
        }

        /* 图片占满可用空间 */
        .attachment-content img {
          max-width: 100% !important;
          max-height: 600px !important;
          object-fit: contain !important;
        }

        .summary-table-header,
        .summary-table-cell,
        .summary-description-cell {
          border-color: #000000 !important;
        }

        .summary-table-wrapper {
          border-color: #000000 !important;
        }

        /* 避免表格被分页 */
        .summary-table {
          page-break-inside: avoid;
        }

        .summary-table tr {
          page-break-inside: avoid;
        }
      }
    `
  })

  const editableRows = useMemo(() => {
    return items.map((item) => ({
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
  }, [items, employee.name, claim.id])

  const totalSgdAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const parsed = Number.parseFloat(item.sgdAmount || '0')
      return Number.isNaN(parsed) ? sum : sum + parsed
    }, 0)
  }, [items])

  const allAttachmentsWithContext = useMemo(() => {
    const attachmentsList: Array<{
      attachment: Attachment
      itemIndex: number | null
      itemName: string | null
    }> = []

    items.forEach((item, index) => {
      const itemAttachments: Attachment[] = []

      if (item.attachments && item.attachments.length > 0) {
        itemAttachments.push(...item.attachments)
      }

      if (attachments && attachments.length > 0) {
        attachments.forEach((attachment) => {
          if (attachment.claimItemId === item.id && !itemAttachments.some((existing) => existing.id === attachment.id)) {
            itemAttachments.push(attachment)
          }
        })
      }

      itemAttachments.forEach((attachment) => {
        attachmentsList.push({
          attachment,
          itemIndex: index + 1,
          itemName: `${item.itemTypeNo} - ${item.itemTypeName}`
        })
      })
    })

    if (attachments && attachments.length > 0) {
      const claimLevelAttachments = attachments.filter((attachment) => !attachment.claimItemId)
      claimLevelAttachments.forEach((attachment) => {
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
  const claimedAmountDisplay = totalSgdAmount.toFixed(2)
  const postingDateDisplay = formatDateValue(claim.createdAt) || 'dd/mm/yyyy'
  const statusLabel = claim.status ? `${claim.status.charAt(0).toUpperCase()}${claim.status.slice(1).toLowerCase()}` : '—'
  const generatedAtDisplay = useMemo(() => format(new Date(), 'dd MMM yyyy, HH:mm'), [])

  const tableHeaderClass = 'summary-table-header border border-slate-300 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600'
  const tableCellClass = 'summary-table-cell border border-slate-200 px-3 py-2 text-sm text-slate-700'
  const tableIndexCellClass = `${tableCellClass} text-center font-semibold`
  const tableMonoCellClass = `${tableCellClass} mono text-right font-mono`
  const descriptionCellClass = 'summary-description-cell border border-slate-200 px-3 py-2 text-xs text-slate-500'

  const isImageFile = (fileType: string, fileName: string) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

    return imageTypes.includes(fileType.toLowerCase()) ||
      imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
  }

  const isPdfFile = (fileType: string, fileName: string) => {
    return fileType.toLowerCase() === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
  }

  const renderFilePreview = (attachment: Attachment) => {
    if (isImageFile(attachment.fileType, attachment.fileName)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="mx-auto max-h-[75vh] max-w-full object-contain"
          onError={(event) => {
            const target = event.target as HTMLImageElement
            target.style.display = 'none'
            const fallback = document.createElement('div')
            fallback.className = 'attachment-placeholder flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500'
            fallback.textContent = 'Preview not available'
            target.parentNode?.appendChild(fallback)
          }}
        />
      )
    }

    if (isPdfFile(attachment.fileType, attachment.fileName)) {
      return (
        <div className="pdf-preview-container max-h-[75vh] w-full overflow-auto print:max-h-none print:h-full">
          <PdfPreview
            url={attachment.url}
            fileName={attachment.fileName}
            maxPages={10}
          />
        </div>
      )
    }

    return (
      <div className="attachment-placeholder flex flex-col items-center gap-4 text-center">
        <FileText className="h-12 w-12 text-slate-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">{attachment.fileName}</p>
          <p className="text-xs text-slate-500">Preview not available. Download to view the original file.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2"
          onClick={() => window.open(attachment.url, '_blank')}
        >
          <FileText className="h-4 w-4" />
          Download
        </Button>
      </div>
    )
  }


  const handleCsvRowChange = (index: number, field: keyof EditableRow, value: string) => {
    setCsvData((prev) => prev.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row
      }
      return {
        ...row,
        [field]: value,
      }
    }))
  }

  const handleExportCsv = () => {
    const headers = [
      '*ContactName',
      '*InvoiceNumber',
      '*InvoiceDate',
      '*DueDate',
      'Description',
      '*Quantity',
      '*UnitAmount',
      '*AccountCode',
      '*TaxType',
      'Currency'
    ]

    const csvRows = [
      headers.join(','),
      ...csvData.map(row => [
        `"${row.contactName}"`,
        `"${row.invoiceNumber}"`,
        `"${row.invoiceDate}"`,
        `"${row.dueDate}"`,
        `"${row.description}"`,
        `"${row.quantity}"`,
        `"${row.unitAmount}"`,
        `"${row.accountCode}"`,
        `"${row.taxType}"`,
        `"${row.currency}"`
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Claim_${formatClaimId(claim.id)}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowCsvDialog(false)
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
    link.download = `Expense_Claim_Report_V2_${formatClaimId(claim.id)}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getReportStyles = () => `
    :root {
      color-scheme: light;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.6;
    }

    .report-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 40px;
      padding: 40px 0;
    }

    .summary-page {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 48px;
      display: flex;
      flex-direction: column;
      gap: 32px;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
    }

    .summary-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 24px;
    }

    .summary-title {
      font-size: 28px;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .summary-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 14px;
      color: #475569;
    }

    .summary-meta-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .summary-info-grid {
      display: grid;
      gap: 24px;
      grid-template-columns: 1fr;
    }

    .summary-info {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .summary-info-row dt {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #64748b;
      font-weight: 600;
    }

    .summary-info-row dd {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
    }

    .summary-highlight {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #f8fafc;
      padding: 32px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .summary-highlight .summary-amount {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .summary-table-wrapper {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }

    .summary-table-header {
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-align: left;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
    }

    .summary-table-cell {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      font-size: 13px;
      color: #1f2937;
    }

    .summary-table-cell.mono {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
    }

    .summary-description-cell {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      background: #f8fafc;
    }

    .summary-total-row td {
      background: #f1f5f9;
      font-weight: 700;
    }

    .summary-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 13px;
      color: #475569;
    }

    .summary-footer .footer-muted {
      font-size: 12px;
      color: #94a3b8;
    }

    .attachment-page {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-height: 100vh;
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
    }

    .attachment-header {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #f8fafc;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .attachment-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
    }

    .attachment-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      font-size: 13px;
      color: #475569;
    }

    .attachment-meta span {
      font-weight: 600;
      color: #1f2937;
    }

    .attachment-content {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 420px;
    }

    .attachment-content img {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
    }

    .attachment-placeholder {
      border: 1px dashed #cbd5f5;
      border-radius: 16px;
      background: #f8fafc;
      padding: 24px;
      font-size: 13px;
      color: #64748b;
      max-width: 520px;
    }

    .no-print {
      display: block;
    }

    @media (max-width: 960px) {
      .summary-page,
      .attachment-page {
        padding: 32px 24px;
      }

      .summary-info {
        grid-template-columns: 1fr;
      }

      .summary-info-grid {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      body {
        background: #ffffff;
      }

      .no-print {
        display: none !important;
      }

      .summary-page,
      .attachment-page {
        box-shadow: none;
        border: none;
        border-radius: 0;
        padding: 24px;
      }

      .attachment-page {
        page-break-before: always;
      }

      .summary-table-header,
      .summary-table-cell,
      .summary-description-cell {
        border-color: #000000;
      }

      .summary-table-wrapper {
        border-color: #000000;
      }

      @page {
        size: A4;
        margin: 15mm;
      }
    }
  `

  return (
    <>
      <div className="no-print sticky top-0 z-10 border-b bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Expense Claim Report</h1>
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
            <Button
              variant="outline"
              onClick={() => {
                setCsvData([...editableRows])
                setShowCsvDialog(true)
              }}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 print:bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 print:max-w-none print:p-0">
          <div ref={printRef} id="report-content-v2" className="report-container space-y-10 print:space-y-0">
            <section className="summary-page rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm print:rounded-none print:border-none print:shadow-none">
              <header className="summary-header flex flex-col gap-4 border-b border-dashed border-slate-300 pb-6">
                <div>
                  <h2 className="summary-title text-2xl font-semibold text-slate-900">Expense Claim Report</h2>
                  <p className="text-sm text-slate-500">Prepared for {employee.name || '—'}</p>
                </div>
                <div className="summary-meta flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="summary-meta-item font-semibold text-slate-700">
                    Claim {formatClaimId(claim.id)}
                  </span>
                  <span className="summary-meta-item">Posting Date: {postingDateDisplay}</span>
                  <span className="summary-meta-item">Attachments: {attachmentCount}</span>
                </div>
              </header>

              <div className="summary-info-grid grid gap-6 lg:grid-cols-[2fr_1fr]">
                <dl className="summary-info grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="summary-info-row flex flex-col gap-1">
                    <dt>Employee Code</dt>
                    <dd>{employee.employeeCode ?? '—'}</dd>
                  </div>
                  <div className="summary-info-row flex flex-col gap-1">
                    <dt>Staff Name</dt>
                    <dd>{employee.name || '—'}</dd>
                  </div>
                  <div className="summary-info-row flex flex-col gap-1">
                    <dt>Department</dt>
                    <dd>{employee.department || '—'}</dd>
                  </div>
                  <div className="summary-info-row flex flex-col gap-1">
                    <dt>Status</dt>
                    <dd>{statusLabel}</dd>
                  </div>
                </dl>

                <div className="summary-highlight flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Total Claim (SGD)
                  </span>
                  <span className="summary-amount text-3xl font-semibold tracking-tight text-slate-900">
                    SGD {claimedAmountDisplay}
                  </span>
                  <div className="flex flex-col gap-1 text-sm text-slate-600">
                    <span>
                      Ref Number:{' '}
                      <span className="font-semibold text-slate-800">{formatClaimId(claim.id)}</span>
                    </span>
                    <span>
                      Attachments:{' '}
                      <span className="font-semibold text-slate-800">{attachmentCount}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="summary-table-wrapper mt-8 overflow-hidden rounded-xl border border-slate-200">
                <table className="summary-table w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className={tableHeaderClass}>Item</th>
                      <th className={tableHeaderClass}>Date</th>
                      <th className={tableHeaderClass}>Type & Description</th>
                      <th className={tableHeaderClass}>Original</th>
                      <th className={tableHeaderClass}>Rate</th>
                      <th className={tableHeaderClass}>SGD Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`${tableCellClass} text-center text-sm text-slate-500`}>
                          No claim line items were provided.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <Fragment key={item.id}>
                          <tr>
                            <td rowSpan={2} className={tableIndexCellClass}>
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td rowSpan={2} className={tableCellClass}>
                              {formatDateValue(item.date, 'dd/MM/yyyy')}
                            </td>
                            <td className={tableCellClass}>
                              [{item.itemTypeNo}] {item.itemTypeName}
                            </td>
                            <td className={tableMonoCellClass}>
                              {item.currencyCode} {Number.parseFloat(item.amount || '0').toFixed(2)}
                            </td>
                            <td className={tableMonoCellClass}>
                              {Number.parseFloat(item.rate || '0').toFixed(4)}
                            </td>
                            <td className={tableMonoCellClass}>
                              {Number.parseFloat(item.sgdAmount || '0').toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={4} className={descriptionCellClass}>
                              {item.note || item.details || '—'}
                            </td>
                          </tr>
                        </Fragment>
                      ))
                    )}
                    {items.length > 0 && (
                      <tr className="summary-total-row bg-slate-100 font-semibold">
                        <td colSpan={5} className={`${tableCellClass} text-right`}>
                          TOTAL:
                        </td>
                        <td className={tableMonoCellClass}>SGD {claimedAmountDisplay}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <footer className="summary-footer border-t border-slate-200 pt-6 text-sm text-slate-600">
                {claim.adminNotes ? (
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-700">Admin Notes</span>
                    <p className="whitespace-pre-wrap">{claim.adminNotes}</p>
                  </div>
                ) : (
                  <p className="italic text-slate-500">No admin notes recorded for this claim.</p>
                )}
                <p className="footer-muted text-xs">Generated on {generatedAtDisplay}</p>
              </footer>
            </section>

            {attachmentCount === 0 ? (
              <section className="attachment-page rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center text-sm text-slate-600 shadow-sm print:rounded-none print:border-none print:shadow-none">
                <h3 className="attachment-title mb-3 text-lg font-semibold text-slate-900">Attachments</h3>
                <p>No attachments were uploaded for this claim.</p>
              </section>
            ) : (
              allAttachmentsWithContext.map(({ attachment, itemIndex, itemName }, idx) => (
                <section
                  key={`attachment-${attachment.id}-${idx}`}
                  className="attachment-page rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm print:rounded-none print:border-none print:shadow-none"
                >
                  <header className="attachment-header flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 no-print">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="attachment-title text-lg font-semibold text-slate-900">
                        Attachment {idx + 1} of {attachmentCount}
                      </h3>
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Claim {formatClaimId(claim.id)}
                      </span>
                    </div>
                    <div className="attachment-meta grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <span className="mr-2 font-semibold text-slate-700">File:</span>
                        {attachment.fileName}
                      </div>
                      <div>
                        <span className="mr-2 font-semibold text-slate-700">Size:</span>
                        {formatFileSize(attachment.fileSize)}
                      </div>
                      {itemIndex !== null && (
                        <div className="sm:col-span-2">
                          <span className="mr-2 font-semibold text-slate-700">
                            Item {String(itemIndex).padStart(2, '0')}:
                          </span>
                          {itemName}
                        </div>
                      )}
                    </div>
                  </header>
                  <div className="attachment-content flex min-h-[420px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white p-6 print:border-none print:rounded-none print:min-h-0">
                    {renderFilePreview(attachment)}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
        <DialogContent className="h-[80vh] max-w-[90vw] overflow-hidden p-0 sm:max-w-5xl">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>Export CSV Data</DialogTitle>
              <div className="text-sm text-gray-600">
                Review and edit the data before exporting to CSV. You can modify any field as needed.
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-hidden rounded-xl border">
                <div className="max-h-[calc(95vh-200px)] overflow-auto">
                  <table className="w-full min-w-[1200px] border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr>
                        <th className="w-12 border border-gray-300 px-2 py-2 text-left text-xs font-medium">#</th>
                        <th className="min-w-[120px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">*ContactName</th>
                        <th className="min-w-[120px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">*InvoiceNumber</th>
                        <th className="min-w-[120px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">*InvoiceDate</th>
                        <th className="min-w-[120px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">*DueDate</th>
                        <th className="min-w-[200px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">Description</th>
                        <th className="min-w-[80px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">*Quantity</th>
                        <th className="min-w-[100px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">*UnitAmount</th>
                        <th className="min-w-[120px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">*AccountCode</th>
                        <th className="min-w-[100px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">*TaxType</th>
                        <th className="min-w-[80px] border border-gray-300 px-2 py-2 text-left text-xs font-medium">Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((row, index) => (
                        <tr key={`csv-row-${row.invoiceNumber}-${index}`}>
                          <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="text"
                              value={row.contactName}
                              onChange={(e) => handleCsvRowChange(index, 'contactName', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="text"
                              value={row.invoiceNumber}
                              onChange={(e) => handleCsvRowChange(index, 'invoiceNumber', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="date"
                              value={row.invoiceDate}
                              onChange={(e) => handleCsvRowChange(index, 'invoiceDate', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="date"
                              value={row.dueDate}
                              onChange={(e) => handleCsvRowChange(index, 'dueDate', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => handleCsvRowChange(index, 'description', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="number"
                              value={row.quantity}
                              onChange={(e) => handleCsvRowChange(index, 'quantity', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="number"
                              step="0.01"
                              value={row.unitAmount}
                              onChange={(e) => handleCsvRowChange(index, 'unitAmount', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="text"
                              value={row.accountCode}
                              onChange={(e) => handleCsvRowChange(index, 'accountCode', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-0">
                            <select
                              value={row.taxType}
                              onChange={(e) => handleCsvRowChange(index, 'taxType', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="No Tax">No Tax</option>
                              <option value="GST">GST</option>
                              <option value="VAT">VAT</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 p-0">
                            <input
                              type="text"
                              value={row.currency}
                              onChange={(e) => handleCsvRowChange(index, 'currency', e.target.value)}
                              className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCsvDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExportCsv}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
