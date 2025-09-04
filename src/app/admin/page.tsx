import { getAllClaims } from '@/lib/actions'
import Link from 'next/link'
import AdminClaimsTable from './components/AdminClaimsTable'

export default async function AdminPage() {
  const claimsData = await getAllClaims()

  if (!claimsData.success || !claimsData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">权限错误</h1>
          <p className="text-gray-600">{claimsData.error}</p>
          <Link href="/claims" className="text-blue-600 hover:underline mt-2 block">
            返回我的申请
          </Link>
        </div>
      </div>
    )
  }

  const { claims, stats, admin } = claimsData.data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="bg-white border-2 border-black p-4 mb-6 text-center">
          <h1 className="text-xl font-bold">Wild Dynasty Pte Ltd</h1>
          <h2 className="text-sm">Admin Dashboard - Claims Management</h2>
        </div>

        {/* 管理员信息 */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200 text-sm">
          <span>Admin: <strong>{admin.name} (EMP{admin.employeeCode.toString().padStart(3, '0')})</strong></span>
          <div className="flex gap-4">
            <Link 
              href="/claims/new"
              className="text-blue-600 hover:underline"
            >
              New Claim
            </Link>
            <Link 
              href="/admin/reports"
              className="text-blue-600 hover:underline"
            >
              Report Generation
            </Link>
            <Link 
              href="/claims"
              className="text-blue-600 hover:underline"
            >
              My Claims
            </Link>
          </div>
        </div>

        {/* 统计面板 */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-300 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Claims</div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>
        </div>

        {/* 金额统计 */}
        <div className="bg-white border border-gray-300 p-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-semibold">Total Approved Amount</div>
            <div className="text-2xl font-bold text-green-600">SGD {stats.totalAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* 申请表格 */}
        <div className="bg-white border border-gray-300">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">All Claims</h3>
            <AdminClaimsTable claims={claims} />
          </div>
        </div>
      </div>
    </div>
  )
}