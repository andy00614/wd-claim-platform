'use client'

import { useState } from 'react'
import { updateClaimStatus } from '@/lib/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Loader2, Eye, Edit, Check, X } from 'lucide-react'

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
    const statusConfig = {
      approved: { variant: 'default' as const, label: 'Approved' },
      submitted: { variant: 'secondary' as const, label: 'Pending' },
      draft: { variant: 'outline' as const, label: 'Draft' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status }
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }


  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Claim ID</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount (SGD)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Admin Notes</TableHead>
            <TableHead>Actions</TableHead>
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
                    CL-2024-{claim.id.toString().padStart(4, '0')}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{claim.employeeName}</div>
                    <div className="text-xs text-muted-foreground">
                      EMP{claim.employeeCode.toString().padStart(3, '0')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{claim.department}</TableCell>
                <TableCell>
                  {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {parseFloat(claim.totalAmount).toFixed(2)}
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
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleSave(claim.id)}
                        disabled={loading}
                        size="sm"
                        className="h-7 px-2"
                      >
                        {loading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button asChild variant="outline" size="sm" className="h-7 px-2">
                        <Link href={`/claims/${claim.id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        onClick={() => handleEdit(claim)}
                        variant="default"
                        size="sm"
                        className="h-7 px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
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
  )
}