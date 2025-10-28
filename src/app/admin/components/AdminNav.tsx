'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin',
      label: 'Claims',
      icon: FileText,
      isActive: pathname === '/admin'
    },
    {
      href: '/admin/employees',
      label: 'Employees',
      icon: Users,
      isActive: pathname.startsWith('/admin/employees')
    }
  ]

  return (
    <div className="flex items-center gap-2 pb-4 border-b">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              'relative',
              item.isActive && 'bg-gray-100 hover:bg-gray-100'
            )}
          >
            <Link href={item.href} className="flex items-center gap-2">
              <Icon className={cn(
                'h-4 w-4',
                item.isActive ? 'text-primary' : 'text-gray-600'
              )} />
              <span className={cn(
                item.isActive && 'font-semibold text-gray-900'
              )}>
                {item.label}
              </span>
              {item.isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}
