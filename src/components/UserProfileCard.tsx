'use client'

import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { User, LogOut, Shield, UserCheck } from 'lucide-react'
import { logoutAction } from '@/app/binding/actions'

interface Employee {
  name: string
  employeeCode: number
  department?: string
  role: 'admin' | 'employee'
}

interface UserProfileCardProps {
  employee: Employee
}

export function UserProfileCard({ employee }: UserProfileCardProps) {
  return (
    <>
      {/* 分隔线 */}
      <div className="h-5 w-px bg-gray-300 mx-1"></div>

      {/* 用户信息 */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 w-8 p-0 rounded-md ${
              employee.role === 'admin'
                ? 'hover:bg-yellow-50 text-yellow-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={employee.name}
          >
            {employee.role === 'admin' ? (
              <UserCheck className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-0" align="end">
          <div className={`relative overflow-hidden ${
            employee.role === 'admin' 
              ? 'bg-gradient-to-br from-yellow-50 via-white to-amber-50' 
              : 'bg-white'
          }`}>
            {/* Admin 顶部装饰条 */}
            {employee.role === 'admin' && (
              <div className="h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500"></div>
            )}
            
            <div className="p-4 space-y-4">
              {/* 用户头像和基本信息 */}
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                  employee.role === 'admin' 
                    ? 'bg-gradient-to-br from-yellow-100 to-amber-200 border-2 border-yellow-300' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  {employee.role === 'admin' ? (
                    <UserCheck className="w-6 h-6 text-amber-700" />
                  ) : (
                    <User className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                      {employee.name}
                    </h4>
                    {employee.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-300 shadow-sm">
                        <Shield className="w-3 h-3" />
                        Administrator
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm mb-0.5 ${
                    employee.role === 'admin' ? 'text-amber-700 font-medium' : 'text-gray-600'
                  }`}>
                    Employee ID: EMP{employee.employeeCode.toString().padStart(3, '0')}
                  </p>
                  
                  {employee.department && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      {employee.department}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 登出按钮区域 */}
            <div className={`p-4 pt-0 ${employee.role === 'admin' ? 'bg-white/50' : ''}`}>
              <div className="border-t border-gray-100 pt-3">
                <Button 
                  onClick={logoutAction} 
                  variant="outline" 
                  size="sm" 
                  className={`w-full transition-all duration-200 ${
                    employee.role === 'admin'
                      ? 'text-gray-700 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 hover:shadow-sm'
                      : 'text-gray-700 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                  }`}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </>
  )
}