import { getAllClaims, checkIsAdmin } from '@/lib/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import dayjs from 'dayjs'
import ReportSelector from './components/ReportSelector'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  // 验证管理员权限
  const adminCheck = await checkIsAdmin()
  
  if (!adminCheck.success || !adminCheck.data?.isAdmin) {
    redirect('/admin')
  }

  // 获取所有已批准的申请
  const claimsData = await getAllClaims()
  
  if (!claimsData.success || !claimsData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">数据加载失败</h1>
          <p className="text-gray-600">{claimsData.error}</p>
          <Link href="/admin" className="text-blue-600 hover:underline mt-2 block">
            返回管理员面板
          </Link>
        </div>
      </div>
    )
  }

  // 筛选出已批准的申请
  const approvedClaims = claimsData.data.claims.filter(claim => claim.status === 'approved')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="bg-white border-2 border-black p-4 mb-6 text-center">
          <h1 className="text-xl font-bold">Wild Dynasty Pte Ltd</h1>
          <h2 className="text-sm">Expense Claim Reports</h2>
        </div>

        {/* 导航 */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Generate Reports for Approved Claims</h3>
          <Link 
            href="/admin"
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50"
          >
            ← Back to Admin
          </Link>
        </div>

        {approvedClaims.length === 0 ? (
          <div className="bg-white border border-gray-300 p-8 text-center">
            <h4 className="text-lg font-medium text-gray-600 mb-2">No Approved Claims</h4>
            <p className="text-gray-500">There are no approved claims available for reporting.</p>
          </div>
        ) : (
          <>
            {/* 统计信息 */}
            <div className="bg-white border border-gray-300 p-4 mb-6">
              <h4 className="font-semibold mb-2">Report Overview</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Approved Claims:</span>
                  <span className="ml-2 font-medium">{approvedClaims.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-2 font-medium">
                    SGD {approvedClaims.reduce((sum, claim) => sum + parseFloat(claim.totalAmount), 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Date Range:</span>
                  <span className="ml-2 font-medium">
                    {approvedClaims.length > 0 && approvedClaims[0].createdAt
                      ? `${dayjs(Math.min(...approvedClaims.map(c => c.createdAt ? new Date(c.createdAt).getTime() : 0))).format('YYYY-MM-DD')} - ${dayjs(Math.max(...approvedClaims.map(c => c.createdAt ? new Date(c.createdAt).getTime() : 0))).format('YYYY-MM-DD')}`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* 报表生成选择器 */}
            <ReportSelector claims={approvedClaims} />
          </>
        )}
      </div>
    </div>
  )
}