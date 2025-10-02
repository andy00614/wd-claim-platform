'use client'

import { Fragment, useMemo, useRef, useState } from 'react'
import { addMonths, format } from 'date-fns'
import dynamic from 'next/dynamic'
import { useReactToPrint } from 'react-to-print'
import { ArrowLeft, FileDown, FileSpreadsheet, FileText, Info, Printer } from 'lucide-react'

import { formatClaimId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const PdfPreview = dynamic(() => import('@/components/ui/pdf-preview'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="mb-3 flex items-center justify-center">
        <FileText className="h-12 w-12 text-red-500" />
      </div>
      <div className="text-center text-sm font-medium text-gray-900">Loading PDF preview...</div>
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
    itemNo: string
    xeroCode: string
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

type EditableRow = {
  contactName: string
  emailAddress: string
  poAddressLine1: string
  poAddressLine2: string
  poAddressLine3: string
  poAddressLine4: string
  poCity: string
  poRegion: string
  poPostalCode: string
  poCountry: string
  invoiceNumber: string
  invoiceDate: string
  approveDate: string
  dueDate: string
  inventoryItemCode: string
  description: string
  quantity: string
  unitAmount: string
  accountCode: string
  taxType: string
  taxAmount: string
  trackingName1: string
  trackingOption1: string
  trackingName2: string
  trackingOption2: string
  currency: string
}

type AttachmentWithContext = {
  attachment: Attachment
  itemIndex: number | null
  itemName: string | null
}

type ClaimItem = ClaimReportProps['items'][number]

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

const isImageFile = (fileType: string, fileName: string) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

  return imageTypes.includes(fileType.toLowerCase()) ||
    imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
}

const isPdfFile = (fileType: string, fileName: string) => {
  return fileType.toLowerCase() === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
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

        .summary-page {
          min-height: calc(100vh - 48px);
          page-break-after: always;
        }

        .attachment-page {
          page-break-before: always;
          page-break-after: always;
          min-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
        }

        .attachment-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 600px;
        }

        .attachment-content .pdf-preview-container {
          width: 100% !important;
          height: 100% !important;
          max-height: 600px !important;
        }

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
    return items.map((item) => {
      console.log(item)
      const invoiceDate = toDateInputValue(item.date)
      const approveDate = invoiceDate
        ? toDateInputValue(addMonths(new Date(invoiceDate), 1))
        : ''

      return {
        contactName: employee.name ?? '',
        emailAddress: '',
        poAddressLine1: '',
        poAddressLine2: '',
        poAddressLine3: '',
        poAddressLine4: '',
        poCity: '',
        poRegion: '',
        poPostalCode: '',
        poCountry: '',
        invoiceNumber: item.evidenceNo || formatClaimId(claim.id),
        invoiceDate,
        approveDate,
        dueDate: toDateInputValue(item.date),
        inventoryItemCode: '#VALUE!',
        description: item.details || item.note || item.itemTypeName,
        quantity: '1',
        unitAmount: item.sgdAmount ? Number.parseFloat(item.sgdAmount).toFixed(2) : '',
        accountCode: `${item.itemNo}-${item.xeroCode}`,
        taxType: 'No Tax',
        taxAmount: '',
        trackingName1: '',
        trackingOption1: '',
        trackingName2: '',
        trackingOption2: '',
        currency: 'SGD',
      }
    })
  }, [items, employee.name, claim.id])

  const totalSgdAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const parsed = Number.parseFloat(item.sgdAmount || '0')
      return Number.isNaN(parsed) ? sum : sum + parsed
    }, 0)
  }, [items])

  const allAttachmentsWithContext = useMemo<AttachmentWithContext[]>(() => {
    const attachmentsList: AttachmentWithContext[] = []

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
          itemName: `${item.itemTypeNo} - ${item.itemTypeName}`,
        })
      })
    })

    if (attachments && attachments.length > 0) {
      attachments
        .filter((attachment) => !attachment.claimItemId)
        .forEach((attachment) => {
          attachmentsList.push({
            attachment,
            itemIndex: null,
            itemName: null,
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

  const handleCsvRowChange = (index: number, field: keyof EditableRow, value: string) => {
    setCsvData((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)))
  }

  const handleCsvDialogOpen = () => {
    setCsvData(editableRows.map((row) => ({ ...row })))
    setShowCsvDialog(true)
  }

  const handleCsvDialogOpenChange = (open: boolean) => {
    if (!open) {
      setShowCsvDialog(false)
      return
    }
    setCsvData(editableRows.map((row) => ({ ...row })))
    setShowCsvDialog(true)
  }

  const handleExportCsv = () => {
    const headers = [
      '*ContactName',
      'EmailAddress',
      'POAddressLine1',
      'POAddressLine2',
      'POAddressLine3',
      'POAddressLine4',
      'POCity',
      'PORegion',
      'POPostalCode',
      'POCountry',
      '*InvoiceNumber',
      '*InvoiceDate',
      'ApproveDate',
      '*DueDate',
      'InventoryItemCode',
      'Description',
      '*Quantity',
      '*UnitAmount',
      '*AccountCode',
      '*TaxType',
      'TaxAmount',
      'TrackingName1',
      'TrackingOption1',
      'TrackingName2',
      'TrackingOption2',
      'Currency',
    ]

    const csvRows = [
      headers.join(','),
      ...csvData.map((row) => {
        console.log(row)
        return [
          `"${row.contactName}"`,
          `"${row.emailAddress}"`,
          `"${row.poAddressLine1}"`,
          `"${row.poAddressLine2}"`,
          `"${row.poAddressLine3}"`,
          `"${row.poAddressLine4}"`,
          `"${row.poCity}"`,
          `"${row.poRegion}"`,
          `"${row.poPostalCode}"`,
          `"${row.poCountry}"`,
          `"${row.invoiceNumber}"`,
          `"${row.invoiceDate}"`,
          `"${row.approveDate}"`,
          `"${row.dueDate}"`,
          `"${row.inventoryItemCode}"`,
          `"${row.description}"`,
          `"${row.quantity}"`,
          `"${row.unitAmount}"`,
          `"${row.accountCode}"`,
          `"${row.taxType}"`,
          `"${row.taxAmount}"`,
          `"${row.trackingName1}"`,
          `"${row.trackingOption1}"`,
          `"${row.trackingName2}"`,
          `"${row.trackingOption2}"`,
          `"${row.currency}"`,
        ].join(',')
      }),
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

  return (
    <>
      <ReportActionBar
        attachmentCount={attachmentCount}
        claimId={claim.id}
        onBack={() => window.history.back()}
        onExportHtml={handleExportHTML}
        onOpenCsv={handleCsvDialogOpen}
        onPrint={handlePrint}
      />

      <div className="bg-slate-50 print:bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 print:max-w-none print:p-0">
          <div ref={printRef} id="report-content-v2" className="report-container space-y-10 print:space-y-0">
            <SummaryPage
              attachmentCount={attachmentCount}
              claim={claim}
              claimedAmountDisplay={claimedAmountDisplay}
              employee={employee}
              generatedAtDisplay={generatedAtDisplay}
              items={items}
              postingDateDisplay={postingDateDisplay}
              statusLabel={statusLabel}
            />

            <AttachmentsSection
              attachmentsWithContext={allAttachmentsWithContext}
              attachmentCount={attachmentCount}
              claimId={claim.id}
            />
          </div>
        </div>
      </div>

      <CsvExportDialog
        open={showCsvDialog}
        rows={csvData}
        onExport={handleExportCsv}
        onOpenChange={handleCsvDialogOpenChange}
        onRowChange={handleCsvRowChange}
      />
    </>
  )
}

type ReportActionBarProps = {
  claimId: number
  attachmentCount: number
  onBack: () => void
  onPrint: () => void
  onExportHtml: () => void
  onOpenCsv: () => void
}

function ReportActionBar({ claimId, attachmentCount, onBack, onPrint, onExportHtml, onOpenCsv }: ReportActionBarProps) {
  return (
    <div className="no-print sticky top-0 z-10 border-b bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Expense Claim Report</h1>
          <p className="text-sm text-slate-500">
            {formatClaimId(claimId)} • {attachmentCount} attachments • Optimized for printing
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={onPrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={onExportHtml} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export HTML
          </Button>
          <Button variant="outline" onClick={onOpenCsv} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  )
}

type SummaryPageProps = {
  claim: ClaimReportProps['claim']
  employee: ClaimReportProps['employee']
  items: ClaimReportProps['items']
  postingDateDisplay: string
  attachmentCount: number
  claimedAmountDisplay: string
  statusLabel: string
  generatedAtDisplay: string
}

function SummaryPage({
  claim,
  employee,
  items,
  postingDateDisplay,
  attachmentCount,
  claimedAmountDisplay,
  statusLabel,
  generatedAtDisplay,
}: SummaryPageProps) {
  const tableHeaderClass = 'summary-table-header border border-slate-300 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600'
  const tableCellClass = 'summary-table-cell border border-slate-200 px-3 py-2 text-sm text-slate-700'
  const tableIndexCellClass = `${tableCellClass} text-center font-semibold`
  const tableMonoCellClass = `${tableCellClass} mono text-right font-mono`
  const descriptionCellClass = 'summary-description-cell border border-slate-200 px-3 py-2 text-xs text-slate-500'

  return (
    <section className="summary-page rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm print:rounded-none print:border-none print:shadow-none">
      <header className="summary-header flex flex-col gap-4 border-b border-dashed border-slate-300 pb-6">
        <div>
          <h2 className="summary-title text-2xl font-semibold text-slate-900">Expense Claim Report</h2>
          <p className="text-sm text-slate-500">Prepared for {employee.name || '—'}</p>
        </div>
        <div className="summary-meta flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span className="summary-meta-item font-semibold text-slate-700">Claim {formatClaimId(claim.id)}</span>
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
      </div>

      <div className="summary-table-wrapper mt-8 overflow-hidden rounded-xl border border-slate-200">
        <table className="summary-table w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className={tableHeaderClass}>Item</th>
              <th className={tableHeaderClass}>Date</th>
              <th className={tableHeaderClass}>Type &amp; Description</th>
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
                <SummaryTableRow
                  key={item.id}
                  item={item}
                  index={index}
                  tableIndexCellClass={tableIndexCellClass}
                  tableCellClass={tableCellClass}
                  tableMonoCellClass={tableMonoCellClass}
                  descriptionCellClass={descriptionCellClass}
                />
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
  )
}

type SummaryTableRowProps = {
  item: ClaimItem
  index: number
  tableIndexCellClass: string
  tableCellClass: string
  tableMonoCellClass: string
  descriptionCellClass: string
}

function SummaryTableRow({ item, index, tableIndexCellClass, tableCellClass, tableMonoCellClass, descriptionCellClass }: SummaryTableRowProps) {
  return (
    <Fragment>
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
          {item.currencyCode === 'SGD'
            ? `SGD ${Number.parseFloat(item.sgdAmount || '0').toFixed(2)}`
            : `${item.currencyCode} ${Number.parseFloat(item.amount || '0').toFixed(2)}`}
        </td>
        <td className={tableMonoCellClass}>{Number.parseFloat(item.rate || '0').toFixed(4)}</td>
        <td className={tableMonoCellClass}>{Number.parseFloat(item.sgdAmount || '0').toFixed(2)}</td>
      </tr>
      <tr>
        <td colSpan={4} className={descriptionCellClass}>
          <div className="flex items-start gap-2">
            {(item.note || item.details) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="mt-0.5 h-3 w-3 cursor-help flex-shrink-0 text-slate-400 hover:text-slate-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-80 bg-slate-900 p-3 text-white">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold">Item Details</div>
                    <div className="text-xs whitespace-pre-wrap">{item.note || item.details}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            <span className="flex-1">{item.note || item.details || '—'}</span>
          </div>
        </td>
      </tr>
    </Fragment>
  )
}

type AttachmentsSectionProps = {
  attachmentsWithContext: AttachmentWithContext[]
  attachmentCount: number
  claimId: number
}

function AttachmentsSection({ attachmentsWithContext, attachmentCount, claimId }: AttachmentsSectionProps) {
  if (attachmentCount === 0) {
    return (
      <section className="attachment-page rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center text-sm text-slate-600 shadow-sm print:rounded-none print:border-none print:shadow-none">
        <h3 className="attachment-title mb-3 text-lg font-semibold text-slate-900">Attachments</h3>
        <p>No attachments were uploaded for this claim.</p>
      </section>
    )
  }

  return (
    <>
      {attachmentsWithContext.map(({ attachment, itemIndex, itemName }, idx) => (
        <section
          key={`attachment-${attachment.id}-${idx}`}
          className="attachment-page rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm print:rounded-none print:border-none print:shadow-none"
        >
          <header className="attachment-header no-print flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="attachment-title text-lg font-semibold text-slate-900">
                Attachment {idx + 1} of {attachmentCount}
              </h3>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Claim {formatClaimId(claimId)}
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
      ))}
    </>
  )
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
      <div className="pdf-preview-container max-h-[75vh] w-full overflow-auto print:h-full print:max-h-none">
        <PdfPreview url={attachment.url} fileName={attachment.fileName} maxPages={10} />
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

type CsvExportDialogProps = {
  open: boolean
  rows: EditableRow[]
  onOpenChange: (open: boolean) => void
  onRowChange: (index: number, field: keyof EditableRow, value: string) => void
  onExport: () => void
}

function CsvExportDialog({ open, rows, onOpenChange, onRowChange, onExport }: CsvExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-full max-w-[95vw] flex-col overflow-hidden p-0 sm:max-w-[90vw] lg:max-w-[1200px] xl:max-w-[1400px]">
        <DialogHeader className="flex-shrink-0 border-b px-6 py-4">
          <DialogTitle>Export CSV Data</DialogTitle>
          <div className="text-sm text-gray-600">
            Review and edit the data before exporting to CSV. You can modify any field as needed.
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-6">
          <div className="h-full overflow-auto">
            <Table className="min-w-[3600px]">
              <TableHeader className="sticky top-0 z-10 bg-gray-50">
                <TableRow>
                  <TableHead className="w-12 text-xs font-medium">#</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">*ContactName</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">EmailAddress</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">POAddressLine1</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">POAddressLine2</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">POAddressLine3</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">POAddressLine4</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-medium">POCity</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-medium">PORegion</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">POPostalCode</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-medium">POCountry</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">*InvoiceNumber</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">*InvoiceDate</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">ApproveDate</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">*DueDate</TableHead>
                  <TableHead className="min-w-[140px] text-xs font-medium">InventoryItemCode</TableHead>
                  <TableHead className="min-w-[200px] text-xs font-medium">Description</TableHead>
                  <TableHead className="min-w-[80px] text-xs font-medium">*Quantity</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-medium">*UnitAmount</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">*AccountCode</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-medium">*TaxType</TableHead>
                  <TableHead className="min-w-[100px] text-xs font-medium">TaxAmount</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">TrackingName1</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">TrackingOption1</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">TrackingName2</TableHead>
                  <TableHead className="min-w-[120px] text-xs font-medium">TrackingOption2</TableHead>
                  <TableHead className="min-w-[80px] text-xs font-medium">Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`csv-row-${row.invoiceNumber}-${index}`}>
                    <TableCell className="px-2 py-1 text-center text-xs font-medium">{index + 1}</TableCell>
                    <EditableCell value={row.contactName} onChange={(value) => onRowChange(index, 'contactName', value)} />
                    <EditableCell value={row.emailAddress} onChange={(value) => onRowChange(index, 'emailAddress', value)} />
                    <EditableCell value={row.poAddressLine1} onChange={(value) => onRowChange(index, 'poAddressLine1', value)} />
                    <EditableCell value={row.poAddressLine2} onChange={(value) => onRowChange(index, 'poAddressLine2', value)} />
                    <EditableCell value={row.poAddressLine3} onChange={(value) => onRowChange(index, 'poAddressLine3', value)} />
                    <EditableCell value={row.poAddressLine4} onChange={(value) => onRowChange(index, 'poAddressLine4', value)} />
                    <EditableCell value={row.poCity} onChange={(value) => onRowChange(index, 'poCity', value)} />
                    <EditableCell value={row.poRegion} onChange={(value) => onRowChange(index, 'poRegion', value)} />
                    <EditableCell value={row.poPostalCode} onChange={(value) => onRowChange(index, 'poPostalCode', value)} />
                    <EditableCell value={row.poCountry} onChange={(value) => onRowChange(index, 'poCountry', value)} />
                    <EditableCell value={row.invoiceNumber} onChange={(value) => onRowChange(index, 'invoiceNumber', value)} />
                    <EditableCell type="date" value={row.invoiceDate} onChange={(value) => onRowChange(index, 'invoiceDate', value)} />
                    <EditableCell type="date" value={row.approveDate} onChange={(value) => onRowChange(index, 'approveDate', value)} />
                    <EditableCell type="date" value={row.dueDate} onChange={(value) => onRowChange(index, 'dueDate', value)} />
                    <EditableCell value={row.inventoryItemCode} onChange={(value) => onRowChange(index, 'inventoryItemCode', value)} />
                    <EditableCell value={row.description} onChange={(value) => onRowChange(index, 'description', value)} />
                    <EditableCell type="number" value={row.quantity} onChange={(value) => onRowChange(index, 'quantity', value)} />
                    <EditableCell type="number" step="0.01" value={row.unitAmount} onChange={(value) => onRowChange(index, 'unitAmount', value)} />
                    <EditableCell value={row.accountCode} onChange={(value) => onRowChange(index, 'accountCode', value)} />
                    <EditableSelect
                      options={[
                        { label: 'No Tax', value: 'No Tax' },
                        { label: 'GST', value: 'GST' },
                        { label: 'VAT', value: 'VAT' },
                      ]}
                      value={row.taxType}
                      onChange={(value) => onRowChange(index, 'taxType', value)}
                    />
                    <EditableCell type="number" step="0.01" value={row.taxAmount} onChange={(value) => onRowChange(index, 'taxAmount', value)} />
                    <EditableCell value={row.trackingName1} onChange={(value) => onRowChange(index, 'trackingName1', value)} />
                    <EditableCell value={row.trackingOption1} onChange={(value) => onRowChange(index, 'trackingOption1', value)} />
                    <EditableCell value={row.trackingName2} onChange={(value) => onRowChange(index, 'trackingName2', value)} />
                    <EditableCell value={row.trackingOption2} onChange={(value) => onRowChange(index, 'trackingOption2', value)} />
                    <EditableCell value={row.currency} onChange={(value) => onRowChange(index, 'currency', value)} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="flex flex-shrink-0 items-center justify-end gap-2 border-t bg-gray-50 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onExport} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type EditableCellProps = {
  value: string
  onChange: (value: string) => void
  type?: string
  step?: string
}

function EditableCell({ value, onChange, type = 'text', step }: EditableCellProps) {
  return (
    <TableCell className="p-0">
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </TableCell>
  )
}

type EditableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}

function EditableSelect({ value, onChange, options }: EditableSelectProps) {
  return (
    <TableCell className="p-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="editable-input w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </TableCell>
  )
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
