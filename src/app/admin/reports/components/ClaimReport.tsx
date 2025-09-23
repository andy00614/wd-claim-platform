'use client'

import { useEffect, useMemo, useState } from 'react'
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

const parseToDate = (value: Date | string | null | undefined) => {
  if (!value) return null
  const dateObj = value instanceof Date ? value : new Date(value)
  return Number.isNaN(dateObj.getTime()) ? null : dateObj
}

const formatDateValue = (value: Date | string | null | undefined, dateFormat = 'dd/MM/yyyy') => {
  const parsed = parseToDate(value)
  return parsed ? format(parsed, dateFormat) : ''
}

const toDateInputValue = (value: Date | string | null | undefined) => {
  const parsed = parseToDate(value)
  return parsed ? format(parsed, 'yyyy-MM-dd') : ''
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

export default function ClaimReport({ claim, items, attachments, employee }: ClaimReportProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(items[0]?.id ?? null)
  const [editableRows, setEditableRows] = useState<EditableRow[]>([])

  useEffect(() => {
    setSelectedItemId(items[0]?.id ?? null)

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

  const selectedItem = useMemo(() => {
    if (!items || items.length === 0) return null
    return items.find((item) => item.id === selectedItemId) ?? items[0]
  }, [items, selectedItemId])

  const totalSgdAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const parsed = Number.parseFloat(item.sgdAmount || '0')
      return Number.isNaN(parsed) ? sum : sum + parsed
    }, 0)
  }, [items])

  const previewAttachments = useMemo(() => {
    if (selectedItem?.attachments && selectedItem.attachments.length > 0) {
      return selectedItem.attachments
    }

    if (attachments && attachments.length > 0) {
      if (selectedItem) {
        const matching = attachments.filter((attachment) => attachment.claimItemId === selectedItem.id)
        if (matching.length > 0) {
          return matching
        }
      }
      return attachments
    }

    return []
  }, [attachments, selectedItem])

  const statusLabel = claim.status ? `${claim.status.charAt(0).toUpperCase()}${claim.status.slice(1)}` : '—'
  const postingDateDisplay = formatDateValue(claim.createdAt) || 'dd/mm/yyyy'
  const claimedAmountDisplay = totalSgdAmount.toFixed(2)

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

  const isImageFile = (fileType: string, fileName: string) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

    return imageTypes.includes(fileType.toLowerCase()) ||
      imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
  }

  const isPdfFile = (fileType: string, fileName: string) => {
    return fileType.toLowerCase() === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
  }

  const renderFilePreview = (attachment: any) => {
    if (isImageFile(attachment.fileType, attachment.fileName)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="w-full h-auto object-contain"
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
        <PdfPreview
          url={attachment.url}
          fileName={attachment.fileName}
          maxPages={3}
        />
      )
    }

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
    link.download = `Expense_Claim_Report_${formatClaimId(claim.id)}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getReportStyles = () => `
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #f5f6f8; color: #111827; }
    .report-container { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .section-card { background: #ffffff; border: 1px solid #d1d5db; border-radius: 12px; padding: 24px; box-sizing: border-box; }
    .claim-header-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .claim-header-table { border: 2px solid #000; border-radius: 10px; overflow: hidden; }
    .claim-header-title { font-weight: 700; text-align: center; padding: 14px; border-bottom: 2px solid #000; font-size: 20px; background: #f3f4f6; }
    .claim-header-row { display: grid; grid-template-columns: 1fr 1.2fr; border-bottom: 1px solid #000; }
    .claim-header-label { padding: 10px 14px; font-weight: 600; border-right: 1px solid #000; font-size: 14px; background: #f8faf8; }
    .claim-header-value { padding: 10px 14px; font-size: 14px; background: #e6f7e9; }
    .claim-header-value.amount { font-weight: 700; font-size: 16px; }
    .claim-header-row:last-child { border-bottom: none; }
    .claim-header-footnote { font-size: 11px; color: #6b7280; margin-top: 6px; text-align: right; }
    .ref-panel { border: 2px solid #000; border-radius: 10px; display: flex; flex-direction: column; height: 100%; }
    .ref-panel-title { font-weight: 700; padding: 12px 14px; border-bottom: 2px solid #000; font-size: 18px; }
    .ref-panel-value { padding: 18px 14px; font-family: 'Courier New', monospace; font-size: 18px; font-weight: 600; }
    .ref-panel-status { padding: 12px 14px; border-top: 1px solid #000; font-size: 14px; }
    .items-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .item-selector { display: flex; flex-direction: column; gap: 12px; }
    .item-row { border: 1px solid #d1d5db; border-radius: 10px; padding: 12px 16px; display: grid; grid-template-columns: 60px 1fr 120px; gap: 12px; align-items: center; background: #f9fafb; cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease; }
    .item-row-active { border-color: #2563eb; background: #eff6ff; }
    .item-row-number { font-weight: 700; font-size: 14px; }
    .item-row-details { font-size: 13px; }
    .item-row-details strong { display: block; margin-bottom: 4px; }
    .item-row-amount { text-align: right; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 600; }
    .preview-panel { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px; background: #f9fbff; }
    .preview-attachments { display: flex; flex-direction: column; gap: 16px; }
    .preview-attachment { border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; background: #ffffff; }
    .preview-attachment-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f3f4f6; font-size: 12px; font-weight: 600; }
    .preview-placeholder { border: 1px dashed #c3dafe; border-radius: 12px; background: #f8fafc; padding: 28px; text-align: center; font-size: 13px; color: #6b7280; }
    .editable-table-wrapper { overflow-x: auto; }
    .editable-table { width: 100%; border-collapse: collapse; min-width: 900px; }
    .editable-table th { background: #f3f4f6; font-weight: 600; font-size: 12px; padding: 8px; border: 1px solid #d1d5db; text-align: left; }
    .editable-table td { border: 1px solid #d1d5db; padding: 0; }
    .editable-input { width: 100%; padding: 8px; border: none; font-size: 12px; box-sizing: border-box; }
    .editable-input:focus { outline: 1px solid #2563eb; }
    @media (max-width: 768px) {
      .claim-header-grid { grid-template-columns: 1fr; }
      .items-grid { grid-template-columns: 1fr; }
      .item-row { grid-template-columns: 50px 1fr; }
      .item-row-amount { text-align: left; }
    }
    @media print {
      body { background: #fff; padding: 12px; font-size: 12px; }
      .no-print { display: none !important; }
      .section-card { box-shadow: none; border: 1px solid #d1d5db; }
    }
  `

  const baseItemRowClasses = 'item-row grid grid-cols-[60px_1fr] xl:grid-cols-[60px_1fr_120px] gap-3 items-center border border-slate-200 rounded-xl px-4 py-3 text-left transition-colors duration-150 shadow-sm focus:outline-none'
  const activeItemRowClasses = 'item-row-active border-blue-500 bg-blue-100 shadow-md'
  const inactiveItemRowClasses = 'bg-slate-50 hover:border-blue-300 hover:bg-blue-50/60'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="no-print bg-white border-b print:hidden">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Expense Claim Report</h1>
              <p className="text-sm text-slate-500">{formatClaimId(claim.id)}</p>
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

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div id="report-content" className="report-wrapper space-y-6">
          {/* Top: Claim Header Block */}
          <section className="section-card claim-header-section bg-white border border-slate-200 shadow-sm rounded-xl p-6 sm:p-8">
            <div className="claim-header-grid gap-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
              <div>
                <div className="claim-header-table border-2 border-black rounded-lg overflow-hidden">
                  <div className="claim-header-title text-center font-bold text-xl border-b-2 border-black bg-slate-100 px-4 py-3">CLAIM FORM</div>
                  <div className="claim-header-row grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] border-b border-black last:border-b-0">
                    <div className="claim-header-label px-4 py-2 font-semibold bg-emerald-50 text-sm border-black border-b sm:border-b-0 sm:border-r">Employee Code</div>
                    <div className="claim-header-value px-4 py-2 bg-emerald-100 text-sm font-medium">{employee.employeeCode ?? '—'}</div>
                  </div>
                  <div className="claim-header-row grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] border-b border-black last:border-b-0">
                    <div className="claim-header-label px-4 py-2 font-semibold bg-emerald-50 text-sm border-black border-b sm:border-b-0 sm:border-r">Staff Name</div>
                    <div className="claim-header-value px-4 py-2 bg-emerald-100 text-sm font-medium">{employee.name || '—'}</div>
                  </div>
                  <div className="claim-header-row grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] border-b border-black last:border-b-0">
                    <div className="claim-header-label px-4 py-2 font-semibold bg-emerald-50 text-sm border-black border-b sm:border-b-0 sm:border-r">Department</div>
                    <div className="claim-header-value px-4 py-2 bg-emerald-100 text-sm font-medium">{employee.department || '—'}</div>
                  </div>
                  <div className="claim-header-row grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] border-b border-black last:border-b-0">
                    <div className="claim-header-label px-4 py-2 font-semibold bg-emerald-50 text-sm border-black border-b sm:border-b-0 sm:border-r">Amount Claimed $</div>
                    <div className="claim-header-value amount px-4 py-2 bg-emerald-100 text-base font-semibold">SGD {claimedAmountDisplay}</div>
                  </div>
                  <div className="claim-header-row grid grid-cols-1 sm:grid-cols-[1fr_1.2fr]">
                    <div className="claim-header-label px-4 py-2 font-semibold bg-emerald-50 border-black border-b sm:border-b-0 sm:border-r text-sm">Posting Date</div>
                    <div className="claim-header-value px-4 py-2 bg-emerald-100 text-sm font-medium">{postingDateDisplay}</div>
                  </div>
                </div>
                <p className="claim-header-footnote text-right text-xs text-slate-500 italic mt-2">dd/mm/yyyy</p>
              </div>

              <div className="ref-panel border-2 border-black rounded-lg flex flex-col overflow-hidden h-full">
                <div className="ref-panel-title px-4 py-3 font-bold text-lg border-b-2 border-black">Ref Number</div>
                <div className="ref-panel-value px-4 py-6 font-mono font-semibold text-lg">{formatClaimId(claim.id)}</div>
                <div className="ref-panel-status px-4 py-3 border-t border-black text-sm">
                  <span className="font-semibold">Status:&nbsp;</span>
                  <span className="capitalize">{statusLabel}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Middle: Per-Item Details and Invoice Preview */}
          <section className="section-card bg-white border border-slate-200 shadow-sm rounded-xl p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-slate-900">Per-Item Claim Details</h3>
                <p className="text-sm text-slate-500">Select an item to review its key information and invoice preview.</p>
              </div>

              <div className="items-grid grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="item-selector flex flex-col gap-3">
                  {items.length === 0 ? (
                    <div className="preview-placeholder border border-dashed border-blue-200 rounded-xl bg-blue-50/60 p-6 text-center text-sm text-slate-500">No expense items available.</div>
                  ) : (
                    items.map((item, index) => {
                      const isActive = selectedItem?.id === item.id
                      const rowClass = isActive ? `${baseItemRowClasses} ${activeItemRowClasses}` : `${baseItemRowClasses} ${inactiveItemRowClasses}`
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItemId(item.id)}
                          className={rowClass}
                        >
                          <span className="item-row-number text-sm font-semibold text-slate-600">{String(index + 1).padStart(2, '0')}</span>
                          <div className="item-row-details text-sm text-slate-700">
                            <strong>{item.itemTypeNo} – {item.itemTypeName}</strong>
                            <span className="block text-xs text-slate-500">Invoice: {item.evidenceNo || '—'} · Date: {formatDateValue(item.date) || 'N/A'}</span>
                          </div>
                          <div className="item-row-amount text-right font-mono text-sm font-semibold text-slate-700">
                            SGD {Number.parseFloat(item.sgdAmount || '0').toFixed(2)}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                <div className="preview-panel border border-slate-200 rounded-xl bg-slate-50/70 p-4 sm:p-6 space-y-4">
                  {selectedItem ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Selected Item</p>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {selectedItem.itemTypeNo} – {selectedItem.itemTypeName}
                          </h3>
                          <p className="text-sm text-slate-600">{selectedItem.note || selectedItem.details || 'No additional details provided.'}</p>
                        </div>
                        <div className="flex flex-wrap items-end gap-6">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Invoice Date</p>
                            <p className="text-sm font-mono">{formatDateValue(selectedItem.date) || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Currency</p>
                            <p className="text-sm font-mono">{selectedItem.currencyCode} {Number.parseFloat(selectedItem.amount || '0').toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Rate</p>
                            <p className="text-sm font-mono">{Number.parseFloat(selectedItem.rate || '0').toFixed(4)}</p>
                          </div>
                          <div className="ml-auto">
                            <p className="text-xs font-semibold text-slate-500 uppercase text-right">SGD Amount</p>
                            <p className="text-xl font-semibold text-emerald-600 font-mono">SGD {Number.parseFloat(selectedItem.sgdAmount || '0').toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="preview-attachments space-y-4">
                        {previewAttachments.length > 0 ? (
                          previewAttachments.map((attachment) => {
                            const isImage = isImageFile(attachment.fileType, attachment.fileName)
                            return (
                              <div key={attachment.id} className="preview-attachment border border-slate-200 rounded-lg overflow-hidden bg-white">
                                <div className="preview-attachment-header flex items-center justify-between px-4 py-2 bg-slate-100 text-xs font-semibold text-slate-600">
                                  <span className="flex items-center gap-2">
                                    {isImage ? (
                                      <Image className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-slate-500" />
                                    )}
                                    <span className="truncate max-w-[240px]">{attachment.fileName}</span>
                                  </span>
                                  <span className="text-xs text-slate-500">{formatFileSize(attachment.fileSize)}</span>
                                </div>
                                <div className="bg-white p-3">
                                  {renderFilePreview(attachment)}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="preview-placeholder border border-dashed border-blue-200 rounded-xl bg-blue-50/60 p-6 text-center text-sm text-slate-500">No attachments uploaded for this item.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="preview-placeholder border border-dashed border-blue-200 rounded-xl bg-blue-50/60 p-6 text-center text-sm text-slate-500">Select an item to see its invoice preview.</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Bottom: Editable Table */}
          <section className="section-card bg-white border border-slate-200 shadow-sm rounded-xl p-6 sm:p-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Editable Accounting Table</h3>
              <p className="text-sm text-slate-500">Adjust the export-ready table below. Required Xero columns are prefilled where possible.</p>
            </div>
            <div className="editable-table-wrapper overflow-x-auto mt-4">
              {editableRows.length === 0 ? (
                <div className="preview-placeholder border border-dashed border-blue-200 rounded-xl bg-blue-50/60 p-6 text-center text-sm text-slate-500">No expense items available to populate the table.</div>
              ) : (
                <table className="editable-table w-full min-w-[900px] border border-slate-200 text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      {editableColumns.map((column) => (
                        <th
                          key={column.key}
                          className="border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editableRows.map((row, rowIndex) => (
                      <tr key={`editable-row-${rowIndex}`}>
                        {editableColumns.map((column) => {
                          if (column.key === 'taxType') {
                            return (
                              <td key={column.key} className="border border-slate-200">
                                <select
                                  className="editable-input w-full border-0 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  value={row[column.key]}
                                  onChange={(event) => handleRowChange(rowIndex, column.key, event.target.value)}
                                >
                                  <option value="No Tax">No Tax</option>
                                  <option value="GST 7%">GST 7%</option>
                                  <option value="GST 8%">GST 8%</option>
                                  <option value="GST 9%">GST 9%</option>
                                </select>
                              </td>
                            )
                          }

                          const inputType = dateFields.includes(column.key)
                            ? 'date'
                            : numericFields.includes(column.key)
                              ? 'number'
                              : 'text'

                          return (
                            <td key={column.key} className="border border-slate-200">
                              <input
                                className={`editable-input w-full border-0 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${numericFields.includes(column.key) ? 'text-right font-mono' : ''}`}
                                type={inputType}
                                step={column.key === 'unitAmount' ? '0.01' : column.key === 'quantity' ? '1' : undefined}
                                value={row[column.key]}
                                onChange={(event) => handleRowChange(rowIndex, column.key, event.target.value)}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
