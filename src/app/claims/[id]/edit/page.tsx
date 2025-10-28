import { getFormInitData, getClaimDetails } from '@/lib/actions'
import { getCurrentEmployee } from '@/lib/employee-actions'
import { formatClaimId } from '@/lib/utils'
import EditClaimForm from './components/EditClaimForm'
import Link from 'next/link'

interface EditClaimPageProps {
  params: Promise<{ id: string }>
}

export default async function EditClaimPage({ params }: EditClaimPageProps) {
  const { id } = await params
  const claimId = parseInt(id, 10)
  
  // 获取表单初始化数据、申请详情和当前用户信息
  const [initData, claimData, currentEmployee] = await Promise.all([
    getFormInitData(),
    getClaimDetails(claimId),
    getCurrentEmployee()
  ])
  
  if (!initData.success || !initData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">数据加载失败</h1>
          <p className="text-gray-600">{initData.error}</p>
        </div>
      </div>
    )
  }

  if (!claimData.success || !claimData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">申请加载失败</h1>
          <p className="text-gray-600">{claimData.error}</p>
          <Link href="/claims" className="text-blue-600 hover:underline mt-2 block">
            返回申请列表
          </Link>
        </div>
      </div>
    )
  }

  if (!currentEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">权限验证失败</h1>
          <p className="text-gray-600">无法获取用户信息</p>
          <Link href="/claims" className="text-blue-600 hover:underline mt-2 block">
            返回申请列表
          </Link>
        </div>
      </div>
    )
  }

  // 权限检查：管理员可以编辑任何申请，普通用户只能编辑自己的submitted状态申请
  const canEdit = currentEmployee.isAdmin ||
    (claimData.data.employee.employeeId === currentEmployee.employee.id &&
     claimData.data.claim.status === 'submitted')

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">无法编辑</h1>
          <p className="text-gray-600">
            {currentEmployee.isAdmin ?
              '无权限编辑此申请' :
              '只能编辑自己的待审核状态申请'
            }
          </p>
          <Link href="/claims" className="text-blue-600 hover:underline mt-2 block">
            返回申请列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="bg-white border-2 border-black p-4 mb-6 text-center">
          <h1 className="text-xl font-bold">Wild Dynasty Pte Ltd</h1>
          <h2 className="text-sm">Edit Expense Claim</h2>
        </div>

        {/* 返回按钮 */}
        <div className="mb-6">
          <Link 
            href={`/claims/${claimId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 hover:bg-gray-50"
          >
            ← Back to Claim Details
          </Link>
        </div>

        {/* 状态栏 */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-200 text-sm">
          <span>Employee: <strong>{claimData.data.employee.name} (WD{claimData.data.employee.employeeCode.toString().padStart(3, '0')})</strong></span>
          <span>Editing: <strong>{formatClaimId(claimId)}</strong></span>
        </div>

        {/* 编辑表单组件 */}
        <EditClaimForm
          claimId={claimId}
          itemTypes={initData.data.itemTypes}
          currencies={initData.data.currencies}
          exchangeRates={initData.data.exchangeRates}
          existingItems={claimData.data.items}
          existingAttachments={claimData.data.attachments || []}
          employeeId={claimData.data.employee.employeeId}
        />
      </div>
    </div>
  )
}