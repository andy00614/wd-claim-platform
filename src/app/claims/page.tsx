import { getUserClaims, checkIsAdmin } from '@/lib/actions'
import Link from 'next/link'
import ActionButtons from './components/ActionButtons'
import { logoutAction } from '../binding/actions'

export default async function ClaimsPage() {
  const [claimsData, adminCheck] = await Promise.all([
    getUserClaims(),
    checkIsAdmin()
  ])

  if (!claimsData.success || !claimsData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">数据加载失败</h1>
          <p className="text-gray-600">{claimsData.error}</p>
          <Link href="/login" className="text-blue-600 hover:underline mt-2 block">
            请先登录
          </Link>
        </div>
      </div>
    )
  }

  const { claims, employee, stats } = claimsData.data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="bg-white border-2 border-black p-4 mb-6 text-center">
          <h1 className="text-xl font-bold">Wild Dynasty Pte Ltd</h1>
          <h2 className="text-sm">Expense Claim History</h2>
        </div>

        {/* 用户信息和导航 */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200 text-sm">
          <span>Employee: <strong>{employee.name} (EMP{employee.employeeCode.toString().padStart(3, '0')})</strong></span>
          <div className="flex gap-4 items-center">
            <Link 
              href="/claims/new"
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
            >
              + New Claim
            </Link>
            {adminCheck.success && adminCheck.data?.isAdmin && (
              <Link 
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                Admin Dashboard
              </Link>
            )}
            <button className="px-4 py-2 border border-gray-300 hover:bg-gray-50" onClick={logoutAction}>
              Logout
            </button>
          </div>
        </div>

        {/* 申请表格 */}
        <div className="bg-white border border-gray-300 mb-6">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Your Claims</h3>
            
            {/* 表格 */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left p-3 font-semibold">Claim ID</th>
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
                        <td className="p-3">CL-2024-{claim.id.toString().padStart(4, '0')}</td>
                        <td className="p-3">{claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-3">{parseFloat(claim.totalAmount).toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            claim.status === 'approved' 
                              ? 'text-green-700 bg-green-100' 
                              : claim.status === 'submitted'
                              ? 'text-orange-700 bg-orange-100'
                              : claim.status === 'draft'
                              ? 'text-blue-700 bg-blue-100'
                              : claim.status === 'rejected'
                              ? 'text-red-700 bg-red-100'
                              : 'text-gray-700 bg-gray-100'
                          }`}>
                            {claim.status === 'approved' ? 'Approved' : 
                             claim.status === 'submitted' ? 'Pending' : 
                             claim.status === 'draft' ? 'Draft' :
                             claim.status === 'rejected' ? 'Rejected' :
                             claim.status}
                          </span>
                        </td>
                        <td className="p-3">{claim.adminNotes || '-'}</td>
                        <td className="p-3">
                          <ActionButtons claim={claim} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-500">
                        No claims found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 统计信息 */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm">
                <strong>Total Approved: SGD {stats.totalApproved.toFixed(2)}</strong>
              </div>
              <div className="text-sm">
                <strong>Pending: {stats.pendingCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 新建申请按钮 */}
        <div className="text-center">
          <Link 
            href="/claims/new"
            className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800"
          >
            + New Claim
          </Link>
        </div>
      </div>
    </div>
  )
}