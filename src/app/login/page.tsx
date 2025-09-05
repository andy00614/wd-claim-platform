'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUrl } from '@/utils/environments'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { TextAnimate, TypingAnimation, BlurFade } from '@/components/ui/magic-ui'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        router.push('/binding') // Redirect to employee binding
      }
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/binding')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    // 使用 getUrl() 获取动态 URL（支持 production、preview、local）
    const redirectTo = `${getUrl()}auth/callback`
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      })
      
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="text-lg font-medium text-gray-900">
            Already signed in
          </div>
          <p className="text-sm text-gray-600">
            Welcome back, {user.email}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/binding')} 
              className="w-full"
            >
              Continue to Dashboard
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md space-y-8 px-6">
        <div className="text-center space-y-4">
          <TextAnimate 
            animation="blur"
            delay={200}
            className="text-3xl font-semibold text-gray-900"
          >
            Welcome Back
          </TextAnimate>
          
          <TypingAnimation
            text="Sign in to access your expense dashboard"
            className="text-gray-600"
            duration={2000}
            delay={800}
          />
        </div>
        
        <BlurFade delay={1500} className="space-y-6">
          <Button 
            onClick={handleGoogleLogin}
            disabled={loading}
            size="lg"
            className="w-full h-12 bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-500">Signing in...</span>
              </>
            ) : (
              <>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
          
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </BlurFade>

        <BlurFade delay={2000} className="text-center">
          <p className="text-xs text-gray-500">
            Wild Dynasty Expense Management
          </p>
        </BlurFade>
      </div>
    </div>
  )
}