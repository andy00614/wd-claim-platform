import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"
import { getCurrentEmployee } from '@/lib/actions'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Receipt, UserCog } from 'lucide-react'
import DynamicTitle from '@/components/DynamicTitle'
import { UserProfileCard } from '@/components/UserProfileCard'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wild Dynasty - Intelligent Expense Claims",
  description: "Your intelligent expense claim platform for seamless business expense management",
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 获取当前路径 (仅用于服务端渲染的用户信息获取)
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  
  // 获取用户信息
  let currentEmployee = null
  try {
    const employeeResult = await getCurrentEmployee()
    if (employeeResult.success && employeeResult.data) {
      currentEmployee = employeeResult.data.employee
    }
  } catch (error) {
    // 如果获取用户信息失败，继续渲染但不显示用户信息
    console.error('Failed to get employee info:', error)
  }

  // 如果是登录页面，不显示header
  if (pathname.includes('/login')) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}>
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          {/* 全局 Header */}
          <div className="flex justify-between items-center mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-gray-200">
            <DynamicTitle />
            <div className="flex items-center gap-1">
              {/* 导航按钮组 */}
              <div className="hidden sm:flex items-center gap-0.5 mr-2">
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                  title="New Claim"
                >
                  <Link href="/claims/new">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                  title="My Claims"
                >
                  <Link href="/claims">
                    <Receipt className="h-4 w-4" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                  title="Admin Panel"
                >
                  <Link href="/admin">
                    <UserCog className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Mobile Navigation */}
              <div className="sm:hidden flex items-center gap-0.5 mr-2">
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                  title="New Claim"
                >
                  <Link href="/claims/new">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                  title="My Claims"
                >
                  <Link href="/claims">
                    <Receipt className="h-4 w-4" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                  title="Admin Panel"
                >
                  <Link href="/admin">
                    <UserCog className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {/* 用户信息 */}
              {currentEmployee && (
                <UserProfileCard employee={currentEmployee} />
              )}
            </div>
          </div>
          
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
