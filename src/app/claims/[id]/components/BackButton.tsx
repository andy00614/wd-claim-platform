'use client'

import { useRouter } from 'next/navigation'

interface BackButtonProps {
  className?: string
  children: React.ReactNode
}

export default function BackButton({ className, children }: BackButtonProps) {
  const router = useRouter()
  
  return (
    <button 
      onClick={() => router.back()}
      className={className}
    >
      {children}
    </button>
  )
}