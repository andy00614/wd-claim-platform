'use client'

import { useState } from 'react'
import { formatClaimId } from '@/lib/utils'
import Link from 'next/link'

interface Claim {
  id: number
  employeeId: number
  employeeName: string
  employeeCode: number
  status: string
  totalAmount: string
  createdAt: Date | null
  adminNotes: string | null
}

interface ReportSelectorProps {
  claims: Claim[]
}

export default function ReportSelector({ claims }: ReportSelectorProps) {
  const [selectedClaims, setSelectedClaims] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClaims([])
    } else {
      setSelectedClaims(claims.map(claim => claim.id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectClaim = (claimId: number) => {
    setSelectedClaims(prev => {
      if (prev.includes(claimId)) {
        return prev.filter(id => id !== claimId)
      } else {
        return [...prev, claimId]
      }
    })
  }

  const generateBatchReportUrl = () => {
    if (selectedClaims.length === 0) return '#'
    return `/admin/reports/batch?ids=${selectedClaims.join(',')}`
  }

  return (
    <div className="bg-white border border-gray-300">
      <div className="p-4">
        <h4 className="text-lg font-semibold mb-4">Select Claims for Report Generation</h4>
        
        {/* 操作按钮 */}
        <div className="flex gap-4 mb-4 pb-4 border-b border-gray-200">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm"
          >
            {selectAll ? 'Deselect All' : 'Select All'}
          </button>
          
          {selectedClaims.length === 1 && (
            <Link
              href={`/admin/reports/${selectedClaims[0]}`}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              Generate Individual Report
            </Link>
          )}
          
          {selectedClaims.length > 1 && (
            <Link
              href={generateBatchReportUrl()}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 text-sm"
            >
              Generate Batch Report ({selectedClaims.length} claims)
            </Link>
          )}

          {selectedClaims.length > 0 && (
            <span className="px-3 py-2 bg-gray-100 text-sm text-gray-600">
              Selected: {selectedClaims.length} claim{selectedClaims.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* 申请列表 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left p-3 font-semibold">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left p-3 font-semibold">Claim ID</th>
                <th className="text-left p-3 font-semibold">Employee</th>
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-left p-3 font-semibold">Amount (SGD)</th>
                <th className="text-left p-3 font-semibold">Admin Notes</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedClaims.includes(claim.id)}
                      onChange={() => handleSelectClaim(claim.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="p-3">{formatClaimId(claim.id)}</td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{claim.employeeName}</div>
                      <div className="text-sm text-gray-500">EMP{claim.employeeCode.toString().padStart(3, '0')}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-3">{parseFloat(claim.totalAmount).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="max-w-xs truncate" title={claim.adminNotes || ''}>
                      {claim.adminNotes || '-'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="px-3 py-1 border border-gray-300 hover:bg-gray-50 text-sm"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/reports/${claim.id}`}
                        className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 text-sm"
                      >
                        Report
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}