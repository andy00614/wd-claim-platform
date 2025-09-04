'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUrl } from '@/utils/environments'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, LogIn, FileText, TrendingUp, Receipt, Mic, Image as ImageIcon } from 'lucide-react'
import DynamicTitle from '@/components/DynamicTitle'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <DynamicTitle />
            </div>
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
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
              <LogIn className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <DynamicTitle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">
          {/* Login Card */}
          <Card className="h-fit">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Access your expense claim dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGoogleLogin}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground text-center w-full">
                By signing in, you agree to use this system for authorized business purposes only.
              </p>
            </CardFooter>
          </Card>

          {/* Features Card */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Expense Claim System</h2>
              <p className="text-muted-foreground">
                Streamline your expense reporting with our AI-powered platform
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Digital Claims</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Submit and track expense claims online with real-time status updates
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Smart expense categorization and entry assistance powered by AI
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Voice Input</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Record expenses quickly using voice commands for hands-free entry
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Receipt Scanner</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Automatic receipt recognition and data extraction from images
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Export & Reports</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Generate CSV exports and detailed reports for accounting teams
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}