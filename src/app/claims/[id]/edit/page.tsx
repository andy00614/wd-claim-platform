import { getFormInitData, getClaimDetails } from '@/lib/actions'
import EditClaimForm from './components/EditClaimForm'
import Link from 'next/link'

interface EditClaimPageProps {
  params: Promise<{ id: string }>
}

export default async function EditClaimPage({ params }: EditClaimPageProps) {
  const { id } = await params
  const claimId = parseInt(id, 10)
  
  // 获取表单初始化数据和申请详情
  const [initData, claimData] = await Promise.all([
    getFormInitData(),
    getClaimDetails(claimId)
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

  // 检查申请状态是否可编辑
  if (claimData.data.claim.status !== 'submitted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">无法编辑</h1>
          <p className="text-gray-600">只能编辑待审核状态的申请</p>
          <Link href="/claims" className="text-blue-600 hover:underline mt-2 block">
            返回申请列表
          </Link>
        </div>
      </div>
    )
  }

  // 与“添加页”一致的简洁布局：直接渲染编辑表单
  return (
    <EditClaimForm
      claimId={claimId}
      itemTypes={initData.data.itemTypes}
      currencies={initData.data.currencies}
      exchangeRates={initData.data.exchangeRates}
      existingItems={claimData.data.items}
      employeeId={claimData.data.owner.id}
    />
  )
}
