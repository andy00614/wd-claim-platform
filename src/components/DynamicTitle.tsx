'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/claims/new')) return 'Create Claim'
  if (pathname.startsWith('/claims')) return 'My Claims'
  if (pathname.startsWith('/admin')) return 'Approval Requests'
  return 'Expense Platform'
}

export default function DynamicTitle() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const router = useRouter()

  return (
    <h1 className="flex items-center gap-2 text-lg font-semibold">
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-75"
        onClick={() => router.push('/claims')}
      >
        <Image
          src="/icon.png"
          width={24}
          height={24}
          alt="WD Logo"
          className="flex-shrink-0 mr-1"
          unoptimized
          priority
        />
        <span className="text-gray-900">Wild Dynasty</span>
      </div>
      <span className="text-gray-500 font-normal">•</span>
      <span className="text-gray-600 font-normal text-sm font-semibold">{title}</span>
    </h1>
  )
}