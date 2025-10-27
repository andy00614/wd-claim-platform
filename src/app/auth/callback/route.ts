import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { userEmployeeBind, employees } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

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

          // 如果已绑定，跳转到 /claims
          if (binding) {
            return NextResponse.redirect(`${origin}/claims`)
          } else {
            // 用户首次登录，通过邮箱匹配已存在的员工并绑定
            try {
              // 1. 获取用户邮箱
              const email = user.email || ''
              if (!email) {
                console.error('No email found for user:', user.id)
                return NextResponse.redirect(`${origin}/login?error=no_email`)
              }

              console.log('Matching employee by email:', email)

              // 2. 查找邮箱匹配的员工记录
              const [matchedEmployee] = await db
                .select()
                .from(employees)
                .where(eq(employees.email, email.toLowerCase()))
                .limit(1)

              // 3. 如果找不到匹配的员工，说明不是公司员工
              if (!matchedEmployee) {
                console.log('No employee found with email:', email)
                return NextResponse.redirect(`${origin}/unauthorized`)
              }

              console.log('Found matching employee:', matchedEmployee.id, matchedEmployee.name)

              // 4. 创建用户-员工绑定
              await db
                .insert(userEmployeeBind)
                .values({
                  userId: user.id,
                  employeeId: matchedEmployee.id,
                })

              // 5. 跳转到 claims 页面
              return NextResponse.redirect(`${origin}/claims`)

            } catch (autoBindError) {
              console.error('Failed to auto-bind employee:', autoBindError)
              // 如果自动绑定失败，跳转到 binding 页面让用户手动选择
              return NextResponse.redirect(`${origin}/binding`)
            }
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