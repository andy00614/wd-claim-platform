'use client'

import Link from 'next/link'

interface Claim {
  id: number
  status: string
  totalAmount: string
  createdAt: Date | null
}

interface ActionButtonsProps {
  claim: Claim
}

export default function ActionButtons({ claim }: ActionButtonsProps) {
  const downloadClaimCSV = (claim: Claim) => {
    const claimId = `CL-2024-${claim.id.toString().padStart(4, '0')}`
    const date = claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'N/A'
    const amount = parseFloat(claim.totalAmount).toFixed(2)
    
    // 创建CSV内容
    const csvContent = [
      ['Claim ID', 'Date', 'Amount (SGD)', 'Status'],
      [claimId, date, amount, claim.status]
    ].map(row => row.join(',')).join('\n')
    
    // 创建并下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${claimId}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex gap-2">
      <Link 
        href={`/claims/${claim.id}`}
        className="px-3 py-1 border border-gray-300 hover:bg-gray-50 text-sm"
      >
        View
      </Link>
      <button 
        onClick={() => downloadClaimCSV(claim)}
        className="px-3 py-1 border border-gray-300 hover:bg-gray-50 text-sm"
      >
        CSV
      </button>
      {claim.status === 'submitted' && (
        <Link 
          href={`/claims/${claim.id}/edit`}
          className="px-3 py-1 border border-gray-300 hover:bg-gray-50 text-sm"
        >
          Edit
        </Link>
      )}
    </div>
  )
}