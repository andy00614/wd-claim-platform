import { getUserClaims } from '@/lib/actions'
import Link from 'next/link'
import ActionButtons from './components/ActionButtons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'

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

  return (
    <div className="space-y-6">

        {/* 申请表格 */}
        <Card>
          <CardHeader>
            <CardTitle>Your Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount (SGD)</TableHead>
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
                          CL-2024-{claim.id.toString().padStart(4, '0')}
                        </TableCell>
                        <TableCell>
                          {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-lg font-bold">
                          {parseFloat(claim.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(claim.status)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={claim.adminNotes || ''}>
                            {claim.adminNotes || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionButtons claim={claim} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No claims found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 统计信息 */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-6 pt-4 border-t">
              <div className="text-sm font-semibold">
                Total Approved: <span className="text-green-600">SGD {stats.totalApproved.toFixed(2)}</span>
              </div>
              <div className="text-sm font-semibold">
                Pending: <span className="text-orange-600">{stats.pendingCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}