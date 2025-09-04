'use client'

import { usePathname } from 'next/navigation'

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/claims/new')) return 'New Expense Claim - Wild Dynasty'
  if (pathname.startsWith('/claims')) return 'Expense Claim History - Wild Dynasty' 
  if (pathname.startsWith('/admin')) return 'Admin Dashboard - Wild Dynasty'
  return 'Wild Dynasty'
}

export default function DynamicTitle() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <h1 className="text-lg font-semibold">
      {title}
    </h1>
  )
}