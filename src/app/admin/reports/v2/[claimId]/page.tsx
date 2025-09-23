import { getClaimDetails, checkIsAdmin } from '@/lib/actions'
import { redirect } from 'next/navigation'
import ClaimReportV2 from '../../components/ClaimReportV2'

interface ClaimReportPageProps {
  params: Promise<{ claimId: string }>
}

export default async function ClaimReportV2Page({ params }: ClaimReportPageProps) {
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

  return (
    <div className="min-h-screen bg-white">
      <ClaimReportV2
        claim={claim}
        items={items}
        attachments={attachments}
        employee={employee}
      />
    </div>
  )
}