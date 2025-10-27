'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUrl } from '@/utils/environments'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { TextAnimate, TypingAnimation, BlurFade } from '@/components/ui/magic-ui'
import Image from 'next/image'

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

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    setError(null)

    // 使用 getUrl() 获取动态 URL（支持 production、preview、local）
    const redirectTo = `${getUrl()}auth/callback`
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center space-y-4">
          <Image
            alt="WD Logo"
            src="/icon.png"
            width={40}
            height={40}
            className="inline mb-4 sm:mb-6 sm:w-12 sm:h-12"
          />
          <TextAnimate
            animation="blur"
            delay={200}
            className="text-xl sm:text-2xl font-semibold text-gray-900"
          >
            Wild Dynasty Expense Claims
          </TextAnimate>

          <TypingAnimation
            text="Where expense claims meet efficiency"
            className="text-gray-600 text-sm sm:text-base"
            duration={2000}
            delay={800}
          />
        </div>

        <BlurFade delay={1500} className="space-y-4 sm:space-y-6">
          <Button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            size="lg"
            className="cursor-pointer w-full h-12 bg-white border border-gray-300 text-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-gray-500" />
                <span className="text-gray-500">Signing in...</span>
              </>
            ) : (
              <>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Continue with Microsoft
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
          <p className="text-sm text-gray-500">
            Intelligent expense management made simple
          </p>
        </BlurFade>
      </div>
    </div>
  )
}