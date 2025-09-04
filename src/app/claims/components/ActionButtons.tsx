'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Download, Eye, Edit, Send } from 'lucide-react'

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
    <div className="flex gap-1">
      <Button asChild variant="outline" size="sm">
        <Link href={`/claims/${claim.id}`}>
          <Eye className="h-3 w-3 mr-1" />
          View
        </Link>
      </Button>
      
      <Button 
        onClick={() => downloadClaimCSV(claim)}
        variant="outline" 
        size="sm"
      >
        <Download className="h-3 w-3 mr-1" />
        CSV
      </Button>
      
      {(claim.status === 'submitted' || claim.status === 'draft') && (
        <Button asChild variant="outline" size="sm">
          <Link href={`/claims/${claim.id}/edit`}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Link>
        </Button>
      )}
      
      {claim.status === 'draft' && (
        <Button asChild size="sm">
          <Link href={`/claims/${claim.id}/submit`}>
            <Send className="h-3 w-3 mr-1" />
            Submit
          </Link>
        </Button>
      )}
    </div>
  )
}