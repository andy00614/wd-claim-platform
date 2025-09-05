'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Eye, Edit, Send, MoreHorizontal } from 'lucide-react'

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-7 w-7 p-0 hover:bg-gray-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link href={`/claims/${claim.id}`} className="flex items-center gap-2 cursor-pointer">
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => downloadClaimCSV(claim)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </DropdownMenuItem>
        
        {(claim.status === 'submitted' || claim.status === 'draft') && (
          <DropdownMenuItem asChild>
            <Link href={`/claims/${claim.id}/edit`} className="flex items-center gap-2 cursor-pointer">
              <Edit className="h-4 w-4" />
              <span>Edit Claim</span>
            </Link>
          </DropdownMenuItem>
        )}
        
        {claim.status === 'draft' && (
          <DropdownMenuItem asChild>
            <Link href={`/claims/${claim.id}/submit`} className="flex items-center gap-2 cursor-pointer text-blue-600">
              <Send className="h-4 w-4" />
              <span>Submit Claim</span>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}