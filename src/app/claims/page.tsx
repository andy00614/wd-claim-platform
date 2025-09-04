import { getUserClaims, checkIsAdmin } from '@/lib/actions'
import Link from 'next/link'
import ActionButtons from './components/ActionButtons'
import { logoutAction } from '../binding/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Settings, LogOut } from 'lucide-react'

function getStatusBadge(status: string) {
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

export default async function ClaimsPage() {
  const [claimsData, adminCheck] = await Promise.all([
    getUserClaims(),
    checkIsAdmin()
  ])

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

  const { claims, employee, stats } = claimsData.data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 页面头部 */}
        <Card className="border-2 border-black">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold">Wild Dynasty Pte Ltd</h1>
            <h2 className="text-sm text-muted-foreground">Expense Claim History</h2>
          </CardContent>
        </Card>

        {/* 用户信息和导航 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b">
          <div className="text-sm">
            Employee: <strong>{employee.name} (EMP{employee.employeeCode.toString().padStart(3, '0')})</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/claims/new">
                <Plus className="mr-2 h-4 w-4" />
                New Claim
              </Link>
            </Button>
            {adminCheck.success && adminCheck.data?.isAdmin && (
              <Button asChild variant="secondary">
                <Link href="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={logoutAction}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

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
                        <TableCell className="text-right font-mono">
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

        {/* 新建申请按钮 */}
        <div className="text-center">
          <Button asChild size="lg" className="bg-black text-white hover:bg-gray-800">
            <Link href="/claims/new">
              <Plus className="mr-2 h-4 w-4" />
              New Claim
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}