'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Not logged in, go to login
        router.push('/login')
        return
      }

      // Check if employee is bound
      const employeeData = localStorage.getItem('currentEmployee')
      if (!employeeData) {
        // Logged in but no employee bound, go to binding
        router.push('/binding')
        return
      }

      // All good, go to dashboard
      router.push('/dashboard')
    }

    checkAuthAndRedirect()
  }, [router, supabase])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid #cccccc',
          borderTop: '2px solid #000000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{
          color: '#666666',
          fontSize: '13px'
        }}>Redirecting...</p>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
