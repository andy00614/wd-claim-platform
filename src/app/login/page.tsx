'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUrl } from '@/utils/environments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Building2, Users, TrendingUp, Shield, Clock, FileCheck } from 'lucide-react'
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
      <div className="min-h-screen bg-gray-50">
        {/* Header - matching system layout */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center pb-4">
              <DynamicTitle />
              <div className="text-sm text-muted-foreground">
                Logged in as: {user.email}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FileCheck className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>You're already signed in</CardTitle>
                <CardDescription className="mt-2">
                  Welcome back, {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - matching system layout */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center pb-4">
            <DynamicTitle />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                About
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Contact
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-5 gap-8 mt-8">
          {/* Left Side - Login Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Sign in to your account</CardTitle>
                <CardDescription>
                  Access the expense management system
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

                <div className="text-xs text-muted-foreground pt-2">
                  <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
              </CardContent>
            </Card>

            {/* Company Info Card */}
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Wild Dynasty Pte Ltd</p>
                    <p className="text-xs text-muted-foreground">
                      Enterprise expense management solution trusted by teams across Singapore.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Feature Showcase */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Welcome Message */}
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  Welcome to WD Expense Platform
                </h1>
                <p className="text-muted-foreground">
                  Streamline your expense reporting with our intelligent management system
                </p>
              </div>

              {/* Feature Tabs */}
              <Tabs defaultValue="features" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="benefits">Benefits</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="features" className="space-y-4 mt-6">
                  <div className="grid gap-4">
                    <Card>
                      <CardContent className="flex items-start gap-4 pt-6">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">AI-Powered Assistant</h3>
                          <p className="text-sm text-muted-foreground">
                            Smart categorization and expense predictions powered by artificial intelligence
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex items-start gap-4 pt-6">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Real-time Processing</h3>
                          <p className="text-sm text-muted-foreground">
                            Instant approval workflows and real-time status tracking
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex items-start gap-4 pt-6">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileCheck className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Automated Reports</h3>
                          <p className="text-sm text-muted-foreground">
                            Generate comprehensive reports with one-click CSV exports
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="benefits" className="space-y-4 mt-6">
                  <div className="grid gap-4">
                    <Card>
                      <CardContent className="flex items-start gap-4 pt-6">
                        <Users className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium mb-1">Team Collaboration</h3>
                          <p className="text-sm text-muted-foreground">
                            Seamless approval chains and team expense visibility
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex items-start gap-4 pt-6">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium mb-1">Cost Savings</h3>
                          <p className="text-sm text-muted-foreground">
                            Reduce processing time by 70% with automated workflows
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="flex items-start gap-4 pt-6">
                        <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium mb-1">Time Efficiency</h3>
                          <p className="text-sm text-muted-foreground">
                            Submit expenses in seconds with voice and image recognition
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium mb-1">Enterprise Security</h3>
                            <p className="text-sm text-muted-foreground">
                              Bank-level encryption and secure data storage in Singapore
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium mb-1">Compliance Ready</h3>
                            <p className="text-sm text-muted-foreground">
                              PDPA compliant with full audit trails and data protection
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium mb-1">Access Control</h3>
                            <p className="text-sm text-muted-foreground">
                              Role-based permissions with Google SSO authentication
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-semibold">500+</div>
                    <p className="text-xs text-muted-foreground mt-1">Active Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-semibold">99.9%</div>
                    <p className="text-xs text-muted-foreground mt-1">Uptime</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-2xl font-semibold">24/7</div>
                    <p className="text-xs text-muted-foreground mt-1">Support</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}