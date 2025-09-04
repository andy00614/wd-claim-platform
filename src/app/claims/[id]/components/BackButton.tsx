'use client'

import { useRouter } from 'next/navigation'
import { forwardRef } from 'react'

interface BackButtonProps {
  className?: string
  children: React.ReactNode
}

const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ className, children, ...props }, ref) => {
    const router = useRouter()
    
    return (
      <button 
        ref={ref}
        onClick={() => router.back()}
        className={className}
        {...props}
      >
        {children}
      </button>
    )
  }
)

BackButton.displayName = 'BackButton'

export default BackButton