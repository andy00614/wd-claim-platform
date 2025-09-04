import { getClaimDetails, checkIsAdmin } from '@/lib/actions'
import { redirect } from 'next/navigation'
import ClaimReport from '../components/ClaimReport'

interface ClaimReportPageProps {
  params: Promise<{ claimId: string }>
}

export default async function ClaimReportPage({ params }: ClaimReportPageProps) {
  // 验证管理员权限
  const adminCheck = await checkIsAdmin()
  
  if (!adminCheck.success || !adminCheck.data?.isAdmin) {
    redirect('/admin')
  }

  const { claimId } = await params
  const claimData = await getClaimDetails(parseInt(claimId, 10))

  if (!claimData.success || !claimData.data) {
    redirect('/admin/reports')
  }

  const { claim, items, attachments, employee } = claimData.data

  // 只允许已批准的申请生成报表
  if (claim.status !== 'approved') {
    redirect('/admin/reports')
  }

  return (
    <div className="min-h-screen bg-white">
      <ClaimReport 
        claim={claim}
        items={items}
        attachments={attachments}
        employee={employee}
      />
    </div>
  )
}