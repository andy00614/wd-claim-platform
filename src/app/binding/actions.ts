'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/employee-actions'

// 绑定员工 Server Action
export async function bindEmployee(prevState: any, formData: FormData) {
  const employeeId = formData.get('employeeId') as string
  
  if (!employeeId) {
    throw new Error('请选择一个员工')
  }
  
  // 获取当前用户
  const user = await getCurrentUser()
  const supabase = await createClient()
  
  try {
    // 检查是否已有绑定，如果有则删除
    const { error: deleteError } = await supabase
      .from('user_employee_bindings')
      .delete()
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('删除旧绑定失败:', deleteError)
    }
    
    // 创建新绑定
    const { error: insertError } = await supabase
      .from('user_employee_bindings')
      .insert({
        user_id: user.id,
        employee_id: parseInt(employeeId, 10)
      })
    
    if (insertError) {
      throw new Error('绑定员工失败: ' + insertError.message)
    }
    
    // 重新验证页面数据和重定向
    revalidatePath('/binding')
    redirect('/claims')
    
  } catch (error) {
    console.error('绑定过程出错:', error)
    throw error
  }
}

// 登出 Server Action
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}