'use client'

import { useState } from 'react'
import { updateClaimStatus } from '@/lib/actions'
import { formatClaimId } from '@/lib/utils'
import Link from 'next/link'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Eye, Pencil, Check, X, BarChart3, MoreHorizontal } from 'lucide-react'

interface Claim {
  id: number
  status: string
  totalAmount: string
  createdAt: Date | null
  approvedAt: Date | null
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
      const result = await updateClaimStatus(claimId, newStatus as "draft" | "submitted" | "approved" | "rejected", newNotes)
      if (result.success) {
        toast.success('申请状态更新成功！')
        // 刷新页面显示最新数据
        window.location.reload()
      } else {
        toast.error(`更新失败：${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error('更新失败：网络错误')
    } finally {
      setLoading(false)
      setEditingClaim(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Approved</Badge>
      case 'submitted':
        return <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100">Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-600 hover:bg-red-100">Rejected</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }


  return (
    <>
      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-4">
        {claims.length > 0 ? (
          claims.map((claim) => (
            <div key={claim.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/claims/${claim.id}`}
                    className="text-blue-600 hover:underline font-mono font-medium text-sm"
                  >
                    {formatClaimId(claim.id)}
                  </Link>
                  <div className="text-xs text-gray-500 mt-1">
                    {claim.createdAt ? dayjs(claim.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'}
                  </div>
                  {claim.approvedAt && (
                    <div className="text-xs text-green-600 mt-0.5">
                      Approved: {dayjs(claim.approvedAt).format('YYYY-MM-DD HH:mm')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg">
                    SGD {parseFloat(claim.totalAmount).toFixed(2)}
                  </div>
                  <div className="mt-1">
                    {editingClaim === claim.id ? (
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="w-20 h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getStatusBadge(claim.status)
                    )}
                  </div>
                </div>
              </div>

              {/* Employee Info */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-sm">{claim.employeeName}</div>
                <div className="text-xs text-gray-500">
                  EMP{claim.employeeCode.toString().padStart(3, '0')} • {claim.department}
                </div>
              </div>

              {/* Admin Notes */}
              {(editingClaim === claim.id || claim.adminNotes) && (
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-600 mb-1">Admin Notes</div>
                  {editingClaim === claim.id ? (
                    <Textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Add admin notes..."
                      className="min-h-[60px] text-xs"
                    />
                  ) : (
                    <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                      {claim.adminNotes || 'No notes'}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end border-t pt-3">
                {editingClaim === claim.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(claim.id)}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/claims/${claim.id}`} className="flex items-center gap-3 cursor-pointer py-2.5 px-3">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">View Details</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/reports/${claim.id}`} className="flex items-center gap-3 cursor-pointer py-2.5 px-3">
                          <BarChart3 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">View Report</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEdit(claim)}
                        className="flex items-center gap-3 cursor-pointer py-2.5 px-3"
                      >
                        <Pencil className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Edit Status</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/claims/${claim.id}/edit`} className="flex items-center gap-3 cursor-pointer py-2.5 px-3">
                          <Pencil className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Edit Claim Details</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <span>No claims found</span>
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Approve Time</TableHead>
              <TableHead className="text-right">Amount (SGD)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admin Notes</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {claims.length > 0 ? (
            claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium">
                  <Link 
                    href={`/claims/${claim.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {formatClaimId(claim.id)}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{claim.employeeName}</div>
                    <div className="text-xs text-muted-foreground">
                      EMP{claim.employeeCode.toString().padStart(3, '0')} • {claim.department}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {claim.createdAt ? dayjs(claim.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'}
                </TableCell>
                <TableCell>
                  {claim.approvedAt ? dayjs(claim.approvedAt).format('YYYY-MM-DD HH:mm') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-mono font-bold text-lg">
                    {parseFloat(claim.totalAmount).toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  {editingClaim === claim.id ? (
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getStatusBadge(claim.status)
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {editingClaim === claim.id ? (
                    <Textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Add admin notes..."
                      className="min-h-[60px] text-xs"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground truncate" title={claim.adminNotes || ''}>
                      {claim.adminNotes || 'No notes'}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingClaim === claim.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(claim.id)}
                        disabled={loading}
                        className="p-1 text-green-500 hover:text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="p-1 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/claims/${claim.id}`} className="flex items-center gap-3 cursor-pointer py-2.5 px-3">
                            <Eye className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">View Details</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/reports/v2/${claim.id}`} className="flex items-center gap-3 cursor-pointer py-2.5 px-3">
                            <BarChart3 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">View Report</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(claim)}
                          className="flex items-center gap-3 cursor-pointer py-2.5 px-3"
                        >
                          <Pencil className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">Edit Status</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/claims/new?claimId=${claim.id}`} className="flex items-center gap-3 cursor-pointer py-2.5 px-3">
                            <Pencil className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Edit Claim Details</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No claims found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </>
  )
}