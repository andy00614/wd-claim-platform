import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"
import { getCurrentEmployee } from '@/lib/actions'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { User, Plus, FileText, Settings, LogOut } from 'lucide-react'
import DynamicTitle from '@/components/DynamicTitle'
import "./globals.css";
import { logoutAction } from "./binding/actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wild Dynasty - Expense Claims",
  description: "Employee expense claim management system",
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
        <div className="max-w-6xl mx-auto p-6">
          {/* 全局 Header */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
            <DynamicTitle />
            <div className="flex items-center gap-1">
              {/* 导航按钮组 */}
              <div className="flex items-center gap-0.5 mr-2">
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
                    <FileText className="h-4 w-4" />
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
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* 分隔线 */}
              <div className="h-5 w-px bg-gray-300 mx-1"></div>

              {/* 用户信息 */}
              {currentEmployee && (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                      title={currentEmployee.name}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64" align="end">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{currentEmployee.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Employee ID: EMP{currentEmployee.employeeCode.toString().padStart(3, '0')}
                        </p>
                      </div>
                      <div className="border-t pt-3">
                        <Button onClick={logoutAction} variant="outline" size="sm" className="w-full hover:bg-red-50 hover:border-red-200">
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
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
