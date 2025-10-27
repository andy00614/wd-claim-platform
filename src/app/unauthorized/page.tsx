'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldAlert, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TextAnimate, BlurFade } from '@/components/ui/magic-ui'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
        </div>

        <BlurFade delay={800} className="space-y-6">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 ml-2">
              <strong className="font-semibold">Access Denied</strong>
              <p className="mt-2 text-sm">
                You are not authorized to access this system. Your email address is not registered as a Wild Dynasty employee.
              </p>
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">What should I do?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>If you are a Wild Dynasty employee, please contact your HR department to register your email address in the system.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>Make sure you are logging in with your company-issued email address.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                <span>If you believe this is an error, please contact your system administrator.</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out and Return to Login
          </Button>
        </BlurFade>

        <BlurFade delay={1200} className="text-center">
          <p className="text-xs text-gray-500">
            Wild Dynasty &copy; {new Date().getFullYear()}
          </p>
        </BlurFade>
      </div>
    </div>
  )
}
