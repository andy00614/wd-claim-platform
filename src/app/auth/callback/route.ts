import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { userEmployeeBind } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 检查用户是否已经绑定员工
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        try {
          const [binding] = await db
            .select()
            .from(userEmployeeBind)
            .where(eq(userEmployeeBind.userId, user.id))
            .limit(1)
          
          // 如果已绑定，跳转到 /claims，否则跳转到 /binding
          if (binding) {
            return NextResponse.redirect(`${origin}/claims`)
          } else {
            return NextResponse.redirect(`${origin}/binding`)
          }
        } catch (error) {
          console.error('Failed to check user binding:', error)
          // 如果查询失败，默认跳转到binding页面
          return NextResponse.redirect(`${origin}/binding`)
        }
      } else {
        return NextResponse.redirect(`${origin}/binding`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}