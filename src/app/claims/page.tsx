import { getUserClaims } from '@/lib/actions'
import Link from 'next/link'
import ActionButtons from './components/ActionButtons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import dayjs from 'dayjs'

export const dynamic = 'force-dynamic'

function getStatusBadge(status: string) {
  const statusConfig = {
    approved: { className: 'bg-green-100 text-green-700 hover:bg-green-100', label: 'Approved' },
    submitted: { className: 'bg-orange-100 text-orange-700 hover:bg-orange-100', label: 'Pending' },
    draft: { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100', label: 'Draft' },
    rejected: { className: 'bg-red-100 text-red-700 hover:bg-red-100', label: 'Rejected' }
  }
  
  const config = statusConfig[status as keyof typeof statusConfig] || { className: 'bg-gray-100 text-gray-700 hover:bg-gray-100', label: status }
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}

export default async function ClaimsPage() {
  const claimsData = await getUserClaims()

  if (!claimsData.success || !claimsData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-destructive">数据加载失败</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{claimsData.error}</p>
            <Button asChild>
              <Link href="/login">
                请先登录
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { claims, stats } = claimsData.data

  // Calculate status counts
  const totalClaims = claims.length
  const submittedCount = claims.filter(c => c.status === 'submitted').length
  const approvedCount = claims.filter(c => c.status === 'approved').length
  const rejectedCount = claims.filter(c => c.status === 'rejected').length
  const totalAmount = claims.reduce((sum, c) => sum + parseFloat(c.totalAmount), 0)

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Mini Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border">
          <div className="text-sm sm:text-lg font-semibold">{totalClaims}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border">
          <div className="text-sm sm:text-lg font-semibold text-orange-600">{submittedCount}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border">
          <div className="text-sm sm:text-lg font-semibold text-green-600">{approvedCount}</div>
          <div className="text-xs text-muted-foreground">Approved</div>
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border sm:block hidden">
          <div className="text-sm sm:text-lg font-semibold text-red-600">{rejectedCount}</div>
          <div className="text-xs text-muted-foreground">Rejected</div>
        </div>

        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border sm:block hidden">
          <div className="text-xs sm:text-lg font-bold font-mono">SGD {totalAmount.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Amount</div>
        </div>
      </div>

        {/* 申请表格 */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <CardTitle className="text-lg sm:text-xl">Your Claims</CardTitle>
            <Button asChild size="sm" className="gap-2 w-full sm:w-auto">
              <Link href="/claims/new">
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">New Claim</span>
                <span className="hidden sm:inline">Create Claim</span>
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-3">
              {claims.length > 0 ? (
                claims.map((claim) => (
                  <div key={claim.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link href={`/claims/${claim.id}`} className="font-mono font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline">
                          CL-{claim.id.toString().padStart(4, '0')}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">
                          {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg">
                          SGD {parseFloat(claim.totalAmount).toFixed(2)}
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(claim.status)}
                        </div>
                      </div>
                    </div>
                    
                    {claim.adminNotes && (
                      <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium text-gray-700 mb-1">Admin Notes:</div>
                        <div className="text-gray-600">{claim.adminNotes}</div>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <ActionButtons claim={claim} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <span>No claims found</span>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/claims/new">
                        <Plus className="h-4 w-4 mr-1" />
                        Create your first claim
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="min-w-[140px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Claim ID
                      </TableHead>
                      <TableHead className="min-w-[160px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </TableHead>
                      <TableHead className="min-w-[140px] px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </TableHead>
                      <TableHead className="min-w-[140px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </TableHead>
                      <TableHead className="min-w-[160px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Admin Notes
                      </TableHead>
                      <TableHead className="min-w-[100px] px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {claims.length > 0 ? (
                    claims.map((claim) => (
                      <TableRow key={claim.id} className="hover:bg-muted/20">
                        <TableCell className="px-5 py-4 font-medium">
                          <Link href={`/claims/${claim.id}`} className="font-mono text-blue-600 hover:text-blue-800 hover:underline">
                            CL-{claim.id.toString().padStart(4, '0')}
                          </Link>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-slate-600">
                          {claim.createdAt
                            ? dayjs(claim.createdAt).format('YYYY-MM-DD HH:mm')
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="px-5 pr-8 py-4 text-right font-mono text-base font-semibold text-slate-800">
                          {parseFloat(claim.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="px-5 pl-6 py-4">
                          {getStatusBadge(claim.status)}
                        </TableCell>
                        <TableCell className="px-5 py-4 max-w-xs text-slate-600">
                          <div className="truncate" title={claim.adminNotes || ''}>
                            {claim.adminNotes || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          <ActionButtons claim={claim} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <span>No claims found</span>
                          <Button asChild size="sm" variant="outline">
                            <Link href="/claims/new">
                              <Plus className="h-4 w-4 mr-1" />
                              Create your first claim
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
              <div className="text-center sm:text-left">
                <div className="text-xs text-gray-500 mb-1">Total Approved</div>
                <div className="text-sm font-bold text-green-600">SGD {stats.totalApproved.toFixed(2)}</div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-xs text-gray-500 mb-1">Pending</div>
                <div className="text-sm font-bold text-orange-600">{stats.pendingCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
