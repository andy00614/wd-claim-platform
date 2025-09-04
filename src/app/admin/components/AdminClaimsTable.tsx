'use client'

import { useState } from 'react'
import { updateClaimStatus } from '@/lib/actions'
import Link from 'next/link'

interface Claim {
  id: number
  status: string
  totalAmount: string
  createdAt: Date | null
  adminNotes: string | null
  employeeName: string
  employeeCode: number
  department: string
}

interface AdminClaimsTableProps {
  claims: Claim[]
}

export default function AdminClaimsTable({ claims }: AdminClaimsTableProps) {
  const [editingClaim, setEditingClaim] = useState<number | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEdit = (claim: Claim) => {
    setEditingClaim(claim.id)
    setNewStatus(claim.status)
    setNewNotes(claim.adminNotes || '')
  }

  const handleCancel = () => {
    setEditingClaim(null)
    setNewStatus('')
    setNewNotes('')
  }

  const handleSave = async (claimId: number) => {
    setLoading(true)
    try {
      const result = await updateClaimStatus(claimId, newStatus, newNotes)
      if (result.success) {
        alert('申请状态更新成功！')
        // 刷新页面显示最新数据
        window.location.reload()
      } else {
        alert(`更新失败：${result.error}`)
      }
    } catch (error) {
      alert('更新失败：网络错误')
    } finally {
      setLoading(false)
      setEditingClaim(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-700 bg-green-100'
      case 'rejected':
        return 'text-red-700 bg-red-100'
      case 'submitted':
        return 'text-orange-700 bg-orange-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'submitted':
        return 'Pending'
      default:
        return status
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left p-3 font-semibold">Claim ID</th>
            <th className="text-left p-3 font-semibold">Employee</th>
            <th className="text-left p-3 font-semibold">Department</th>
            <th className="text-left p-3 font-semibold">Date</th>
            <th className="text-left p-3 font-semibold">Amount (SGD)</th>
            <th className="text-left p-3 font-semibold">Status</th>
            <th className="text-left p-3 font-semibold">Admin Notes</th>
            <th className="text-left p-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {claims.length > 0 ? (
            claims.map((claim) => (
              <tr key={claim.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3">
                  <Link 
                    href={`/claims/${claim.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    CL-2024-{claim.id.toString().padStart(4, '0')}
                  </Link>
                </td>
                <td className="p-3">
                  {claim.employeeName}
                  <div className="text-xs text-gray-500">
                    EMP{claim.employeeCode.toString().padStart(3, '0')}
                  </div>
                </td>
                <td className="p-3">{claim.department}</td>
                <td className="p-3">
                  {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="p-3">{parseFloat(claim.totalAmount).toFixed(2)}</td>
                <td className="p-3">
                  {editingClaim === claim.id ? (
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="submitted">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(claim.status)}`}>
                      {getStatusText(claim.status)}
                    </span>
                  )}
                </td>
                <td className="p-3 max-w-xs">
                  {editingClaim === claim.id ? (
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Add admin notes..."
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-y min-h-[60px]"
                    />
                  ) : (
                    <div className="text-xs text-gray-600 truncate" title={claim.adminNotes || ''}>
                      {claim.adminNotes || 'No notes'}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {editingClaim === claim.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(claim.id)}
                        disabled={loading}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="px-2 py-1 border border-gray-300 hover:bg-gray-50 text-xs rounded"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleEdit(claim)}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-center p-8 text-gray-500">
                No claims found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}