import { getAllClaims } from '@/lib/actions'
import Link from 'next/link'
import AdminClaimsTable from './components/AdminClaimsTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText } from 'lucide-react'

export default async function AdminPage() {
  const claimsData = await getAllClaims()

  if (!claimsData.success || !claimsData.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertDescription className="space-y-4">
            <div>
              <h3 className="font-semibold">权限错误</h3>
              <p className="text-sm">{claimsData.error}</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/claims">
                返回我的申请
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { claims, stats } = claimsData.data

  return (
    <div className="space-y-6">

      {/* 简洁统计栏 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Claims</div>
        </div>
        
        <div>
          <div className="text-lg font-semibold">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        
        <div>
          <div className="text-lg font-semibold">{stats.approved}</div>
          <div className="text-xs text-muted-foreground">Approved</div>
        </div>
        
        <div>
          <div className="text-lg font-semibold">{stats.rejected}</div>
          <div className="text-xs text-muted-foreground">Rejected</div>
        </div>

        <div className="col-span-2 md:col-span-1">
          <div className="text-lg font-semibold">SGD {stats.totalAmount.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Total Amount</div>
        </div>
      </div>

      {/* 申请表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Claims
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminClaimsTable claims={claims} />
        </CardContent>
      </Card>
    </div>
  )
}