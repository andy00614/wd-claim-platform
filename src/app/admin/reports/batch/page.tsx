import { getClaimDetails, checkIsAdmin } from '@/lib/actions'
import { redirect } from 'next/navigation'
import BatchReport from '../components/BatchReport'

interface BatchReportPageProps {
  searchParams: Promise<{ ids?: string }>
}

export default async function BatchReportPage({ searchParams }: BatchReportPageProps) {
  // 验证管理员权限
  const adminCheck = await checkIsAdmin()
  
  if (!adminCheck.success || !adminCheck.data?.isAdmin) {
    redirect('/admin')
  }

  const { ids } = await searchParams
  
  if (!ids) {
    redirect('/admin/reports')
  }

  const claimIds = ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
  
  if (claimIds.length === 0) {
    redirect('/admin/reports')
  }

  // 获取所有申请的详细信息
  const claimDataPromises = claimIds.map(id => getClaimDetails(id))
  const claimDataResults = await Promise.all(claimDataPromises)

  // 筛选出成功获取且已批准的申请
  const validClaims = claimDataResults
    .filter(result => result.success && result.data && result.data.claim.status === 'approved')
    .map(result => result.data!)

  if (validClaims.length === 0) {
    redirect('/admin/reports')
  }

  return (
    <div className="min-h-screen bg-white">
      <BatchReport claims={validClaims} />
    </div>
  )
}