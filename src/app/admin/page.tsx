import { getAllClaims } from '@/lib/actions'
import Link from 'next/link'
import AdminClaimsTable from './components/AdminClaimsTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ShieldX, ArrowLeft } from 'lucide-react'

export default async function AdminPage() {
  const claimsData = await getAllClaims()

  if (!claimsData.success || !claimsData.data) {
    return (
      <div className="flex items-center justify-center pt-32 ">
        <div className="w-full max-w-md space-y-6 px-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                Access Denied
              </h1>
              
              <p className="text-gray-600 text-sm">
                {claimsData.error || "You don't have permission to access this page"}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/claims">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Claims
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { claims, stats } = claimsData.data

  return (
    <div className="space-y-6">

      {/* Mini Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border shadow-sm">
          <div className="text-sm sm:text-lg font-semibold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border shadow-sm">
          <div className="text-sm sm:text-lg font-semibold text-orange-600">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border shadow-sm">
          <div className="text-sm sm:text-lg font-semibold text-green-600">{stats.approved}</div>
          <div className="text-xs text-muted-foreground">Approved</div>
        </div>
        
        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border shadow-sm sm:block hidden">
          <div className="text-sm sm:text-lg font-semibold text-red-600">{stats.rejected}</div>
          <div className="text-xs text-muted-foreground">Rejected</div>
        </div>

        <div className="text-center p-2 sm:p-3 bg-white rounded-lg border shadow-sm sm:block hidden">
          <div className="text-xs sm:text-lg font-bold font-mono">SGD {stats.totalAmount.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Amount</div>
        </div>
      </div>

      {/* 申请表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span className="text-gray-900">All Claims</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminClaimsTable claims={claims} />
        </CardContent>
      </Card>
    </div>
  )
}