'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/claims/new')) return 'New Expense Claim'
  if (pathname.startsWith('/claims')) return 'Expense Claim History' 
  if (pathname.startsWith('/admin')) return 'Admin Dashboard'
  return 'Wild Dynasty'
}

export default function DynamicTitle() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <h1 className="flex items-center gap-2 text-lg font-semibold">
      <Image 
        src="/icon.png" 
        width={24} 
        height={24} 
        alt="WD Logo" 
        className="flex-shrink-0"
        unoptimized
        priority
      />
      <span className="text-gray-900">Wild Dynasty</span>
      <span className="text-gray-500 font-normal">•</span>
      <span className="text-gray-600 font-normal text-sm font-semibold">{title}</span>
    </h1>
  )
}