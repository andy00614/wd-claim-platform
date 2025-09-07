'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/claims/new')) return 'Create Claim'
  if (pathname.startsWith('/claims')) return 'My Claims'  
  if (pathname.startsWith('/admin')) return 'Approval Requests'
  return 'Expense Platform'
}

export default function DynamicTitle() {
  const pathname = usePathname()
  const router = useRouter()
  const [title, setTitle] = useState('Expense Platform') // 默认值避免 hydration 不匹配
  
  useEffect(() => {
    // 在客户端挂载后更新标题
    setTitle(getPageTitle(pathname))
  }, [pathname])

  return (
    <h1 className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg font-semibold min-w-0">
      <div
        className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-75 flex-shrink-0"
        onClick={() => router.push('/claims')}
      >
        <Image
          src="/icon.png"
          width={20}
          height={20}
          alt="WD Logo"
          className="sm:w-6 sm:h-6 flex-shrink-0"
          unoptimized
          priority
        />
        <span className="text-gray-900 hidden sm:inline">Wild Dynasty</span>
        <span className="text-gray-900 sm:hidden text-sm font-bold">WD</span>
      </div>
      <span className="text-gray-500 font-normal hidden sm:inline">•</span>
      <span className="text-gray-600 font-semibold text-xs sm:text-sm truncate">{title}</span>
    </h1>
  )
}