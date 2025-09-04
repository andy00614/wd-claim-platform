'use server'

import { db } from '@/lib/db/drizzle'
import { claims, claimItems, itemType, currency, employees, userEmployeeBind } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq } from 'drizzle-orm'

// 提交费用申请
export async function submitClaim(prevState: any, formData: FormData) {
  try {
    const employeeId = parseInt(formData.get('employeeId') as string)
    const expenseItemsJson = formData.get('expenseItems') as string
    const expenseItems = JSON.parse(expenseItemsJson)

    if (!employeeId || !expenseItems || expenseItems.length === 0) {
      return { success: false, error: '缺少必要的申请数据' }
    }

    // 计算总金额
    const totalAmount = expenseItems.reduce((sum: number, item: any) => sum + item.sgdAmount, 0)

    // 在数据库事务中处理
    const result = await db.transaction(async (tx) => {
      // 1. 创建主申请记录
      const [newClaim] = await tx.insert(claims).values({
        employeeId,
        totalAmount: totalAmount.toString(),
        status: 'submitted'
      }).returning({ id: claims.id })

      // 2. 获取所有需要的 itemType 和 currency 映射
      const itemTypes = await tx.select().from(itemType)
      const currencies = await tx.select().from(currency)
      
      const itemTypeMap = Object.fromEntries(itemTypes.map(it => [it.no, it.id]))
      const currencyMap = Object.fromEntries(currencies.map(c => [c.code, c.id]))
      

      // 3. 创建申请项目记录
      const claimItemsData = expenseItems.map((item: any) => {
        const [month, day] = item.date.split('/')
        const currentYear = new Date().getFullYear()
        const itemDate = new Date(currentYear, parseInt(month) - 1, parseInt(day))

        return {
          claimId: newClaim.id,
          employeeId,
          date: itemDate,
          type: itemTypeMap[item.itemNo],
          note: item.note,
          details: item.details,
          evidenceNo: item.evidenceNo,
          currencyId: currencyMap[item.currency],
          amount: item.amount.toString(),
          rate: item.rate.toString(),
          sgdAmount: item.sgdAmount.toString(),
        }
      })

      const insertedItems = await tx.insert(claimItems).values(claimItemsData).returning()

      return {
        claimId: newClaim.id,
        itemsCount: insertedItems.length,
        totalAmount
      }
    })

    return {
      success: true,
      message: '费用申请提交成功',
      data: result
    }

  } catch (error) {
    console.error('提交费用申请失败:', error)
    return {
      success: false,
      error: '提交费用申请失败',
      details: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 获取初始化数据（一次性获取所有需要的数据）
export async function getFormInitData() {
  try {
    const [itemTypes, currencies] = await Promise.all([
      db.select().from(itemType),
      db.select().from(currency)
    ])

    // 获取实时汇率数据（免费API）
    let exchangeRates = {
      'SGD': 1.0000,
      'THB': 0.0270,
      'PHP': 0.0240,
      'VND': 0.000041,
      'CNY': 0.1950,
      'INR': 0.0120,
      'IDR': 0.000067,
      'USD': 1.3400,
      'MYR': 0.2950
    }

    try {
      const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/sgd.json')
      const data = await response.json()
      
      if (data.sgd) {
        // 将API返回的汇率转换为我们需要的格式（1 外币 = ? SGD）
        exchangeRates = {
          'SGD': 1.0000,
          'THB': data.sgd.thb ? 1 / data.sgd.thb : exchangeRates['THB'],
          'PHP': data.sgd.php ? 1 / data.sgd.php : exchangeRates['PHP'],
          'VND': data.sgd.vnd ? 1 / data.sgd.vnd : exchangeRates['VND'],
          'CNY': data.sgd.cny ? 1 / data.sgd.cny : exchangeRates['CNY'],
          'INR': data.sgd.inr ? 1 / data.sgd.inr : exchangeRates['INR'],
          'IDR': data.sgd.idr ? 1 / data.sgd.idr : exchangeRates['IDR'],
          'USD': data.sgd.usd ? 1 / data.sgd.usd : exchangeRates['USD'],
          'MYR': data.sgd.myr ? 1 / data.sgd.myr : exchangeRates['MYR']
        }
      }
    } catch (error) {
      console.log('使用备用汇率数据:', error)
      // 如果API失败，使用备用数据，不影响功能
    }

    return {
      success: true,
      data: {
        itemTypes,
        currencies,
        exchangeRates
      }
    }
  } catch (error) {
    console.error('Failed to fetch form init data:', error)
    return { success: false, error: 'Failed to fetch form init data' }
  }
}

// 获取当前登录用户的员工信息
export async function getCurrentEmployee() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: '用户未登录' }
    }

    // 查询用户绑定的员工信息
    const binding = await db
      .select({
        employeeId: userEmployeeBind.employeeId,
        name: employees.name,
        employeeCode: employees.employeeCode,
        department: employees.departmentEnum,
        role: employees.role
      })
      .from(userEmployeeBind)
      .innerJoin(employees, eq(userEmployeeBind.employeeId, employees.id))
      .where(eq(userEmployeeBind.userId, user.id))
      .limit(1)

    if (binding.length === 0) {
      return { success: false, error: '用户未绑定员工信息' }
    }

    return {
      success: true,
      data: {
        userId: user.id,
        employee: binding[0]
      }
    }
  } catch (error) {
    console.error('Failed to get current employee:', error)
    return { success: false, error: '获取用户信息失败' }
  }
}

// 获取用户的申请记录
export async function getUserClaims() {
  try {
    const currentEmployee = await getCurrentEmployee()

    if (!currentEmployee.success || !currentEmployee.data) {
      return { success: false, error: currentEmployee.error || '用户未登录或未绑定员工' }
    }

    const employeeId = currentEmployee.data.employee.employeeId

    // 查询用户的申请记录
    const userClaims = await db
      .select({
        id: claims.id,
        status: claims.status,
        totalAmount: claims.totalAmount,
        createdAt: claims.createdAt,
        adminNotes: claims.adminNotes
      })
      .from(claims)
      .where(eq(claims.employeeId, employeeId))
      .orderBy(claims.createdAt)

    // 计算统计信息
    const approved = userClaims.filter(claim => claim.status === 'approved')
    const pending = userClaims.filter(claim => claim.status === 'submitted')
    
    const totalApproved = approved.reduce((sum, claim) => sum + parseFloat(claim.totalAmount), 0)
    const pendingCount = pending.length

    return {
      success: true,
      data: {
        claims: userClaims,
        employee: currentEmployee.data.employee,
        stats: {
          totalApproved,
          pendingCount
        }
      }
    }
  } catch (error) {
    console.error('Failed to get user claims:', error)
    return { success: false, error: '获取申请记录失败' }
  }
}

// 获取单个申请详情
export async function getClaimDetails(claimId: number) {
  try {
    const currentEmployee = await getCurrentEmployee()
    
    if (!currentEmployee.success || !currentEmployee.data) {
      return { success: false, error: '用户未登录或未绑定员工' }
    }

    // 查询申请基本信息
    const [claim] = await db
      .select({
        id: claims.id,
        status: claims.status,
        totalAmount: claims.totalAmount,
        createdAt: claims.createdAt,
        employeeId: claims.employeeId
      })
      .from(claims)
      .where(eq(claims.id, claimId))
      .limit(1)

    if (!claim) {
      return { success: false, error: '申请不存在' }
    }

    // 验证申请属于当前用户
    if (claim.employeeId !== currentEmployee.data.employee.employeeId && currentEmployee.data.employee.role !== 'admin') {
      return { success: false, error: '无权查看此申请' }
    }

    // 查询申请项目详情
    const claimItemsResult = await db
      .select({
        id: claimItems.id,
        date: claimItems.date,
        note: claimItems.note,
        details: claimItems.details,
        evidenceNo: claimItems.evidenceNo,
        amount: claimItems.amount,
        rate: claimItems.rate,
        sgdAmount: claimItems.sgdAmount,
        itemTypeName: itemType.name,
        itemTypeNo: itemType.no,
        currencyCode: currency.code
      })
      .from(claimItems)
      .innerJoin(itemType, eq(claimItems.type, itemType.id))
      .innerJoin(currency, eq(claimItems.currencyId, currency.id))
      .where(eq(claimItems.claimId, claimId))
      .orderBy(claimItems.date)

    return {
      success: true,
      data: {
        claim,
        items: claimItemsResult,
        employee: currentEmployee.data.employee
      }
    }
  } catch (error) {
    console.error('Failed to get claim details:', error)
    return { success: false, error: '获取申请详情失败' }
  }
}

// 更新申请
export async function updateClaim(claimId: number, _prevState: any, formData: FormData) {
  try {
    const currentEmployee = await getCurrentEmployee()
    
    if (!currentEmployee.success || !currentEmployee.data) {
      return { success: false, error: '用户未登录或未绑定员工' }
    }

    const employeeId = currentEmployee.data.employee.employeeId
    const expenseItemsJson = formData.get('expenseItems') as string
    const expenseItems = JSON.parse(expenseItemsJson)

    if (!expenseItems || expenseItems.length === 0) {
      return { success: false, error: '缺少费用项目数据' }
    }

    // 验证申请存在且属于当前用户
    const [existingClaim] = await db
      .select({ employeeId: claims.employeeId, status: claims.status })
      .from(claims)
      .where(eq(claims.id, claimId))
      .limit(1)

    if (!existingClaim) {
      return { success: false, error: '申请不存在' }
    }

    if (existingClaim.employeeId !== employeeId) {
      return { success: false, error: '无权编辑此申请' }
    }

    if (existingClaim.status !== 'submitted') {
      return { success: false, error: '只能编辑待审核状态的申请' }
    }

    // 计算新的总金额
    const totalAmount = expenseItems.reduce((sum: number, item: any) => sum + item.sgdAmount, 0)

    // 在数据库事务中处理更新
    const result = await db.transaction(async (tx) => {
      // 1. 更新主申请记录
      await tx
        .update(claims)
        .set({
          totalAmount: totalAmount.toString(),
          updatedAt: new Date()
        })
        .where(eq(claims.id, claimId))

      // 2. 删除旧的申请项目
      await tx.delete(claimItems).where(eq(claimItems.claimId, claimId))

      // 3. 获取映射数据
      const itemTypes = await tx.select().from(itemType)
      const currencies = await tx.select().from(currency)
      
      const itemTypeMap = Object.fromEntries(itemTypes.map(it => [it.no, it.id]))
      const currencyMap = Object.fromEntries(currencies.map(c => [c.code, c.id]))

      // 4. 插入新的申请项目
      const claimItemsData = expenseItems.map((item: any) => {
        const [month, day] = item.date.split('/')
        const currentYear = new Date().getFullYear()
        const itemDate = new Date(currentYear, parseInt(month) - 1, parseInt(day))

        return {
          claimId,
          employeeId,
          date: itemDate,
          type: itemTypeMap[item.itemNo],
          note: item.note,
          details: item.details,
          evidenceNo: item.evidenceNo,
          currencyId: currencyMap[item.currency],
          amount: item.amount.toString(),
          rate: item.rate.toString(),
          sgdAmount: item.sgdAmount.toString(),
        }
      })

      await tx.insert(claimItems).values(claimItemsData)

      return {
        claimId,
        itemsCount: claimItemsData.length,
        totalAmount
      }
    })

    return {
      success: true,
      message: '申请更新成功',
      data: result
    }

  } catch (error) {
    console.error('更新申请失败:', error)
    return {
      success: false,
      error: '更新申请失败',
      details: error instanceof Error ? error.message : '未知错误'
    }
  }
}
// 检查当前用户是否为管理员
export async function checkIsAdmin() {
  try {
    const currentEmployee = await getCurrentEmployee()
    
    if (!currentEmployee.success || !currentEmployee.data) {
      return { success: false, error: "用户未登录或未绑定员工" }
    }

    // 查询用户的角色信息
    const [employee] = await db
      .select({
        role: employees.role,
        name: employees.name,
        employeeCode: employees.employeeCode
      })
      .from(employees)
      .where(eq(employees.id, currentEmployee.data.employee.employeeId))
      .limit(1)

    if (!employee) {
      return { success: false, error: "员工信息不存在" }
    }

    const isAdmin = employee.role === "admin"

    return {
      success: true,
      data: {
        isAdmin,
        employee: {
          ...currentEmployee.data.employee,
          role: employee.role
        }
      }
    }
  } catch (error) {
    console.error("Failed to check admin status:", error)
    return { success: false, error: "检查管理员权限失败" }
  }
}

// 获取所有申请记录（管理员功能）
export async function getAllClaims() {
  try {
    const adminCheck = await checkIsAdmin()
    
    if (!adminCheck.success || !adminCheck.data?.isAdmin) {
      return { success: false, error: "权限不足：仅管理员可访问" }
    }

    // 查询所有申请记录，连接员工信息
    const allClaims = await db
      .select({
        id: claims.id,
        status: claims.status,
        totalAmount: claims.totalAmount,
        createdAt: claims.createdAt,
        adminNotes: claims.adminNotes,
        employeeName: employees.name,
        employeeCode: employees.employeeCode,
        department: employees.departmentEnum
      })
      .from(claims)
      .innerJoin(employees, eq(claims.employeeId, employees.id))
      .orderBy(claims.createdAt)

    // 计算统计信息
    const stats = {
      total: allClaims.length,
      pending: allClaims.filter(claim => claim.status === "submitted").length,
      approved: allClaims.filter(claim => claim.status === "approved").length,
      rejected: allClaims.filter(claim => claim.status === "rejected").length,
      totalAmount: allClaims
        .filter(claim => claim.status === "approved")
        .reduce((sum, claim) => sum + parseFloat(claim.totalAmount), 0)
    }

    return {
      success: true,
      data: {
        claims: allClaims,
        stats,
        admin: adminCheck.data.employee
      }
    }
  } catch (error) {
    console.error("Failed to get all claims:", error)
    return { success: false, error: "获取申请记录失败" }
  }
}

// 更新申请状态（管理员功能）  
export async function updateClaimStatus(claimId: number, status: string, adminNotes?: string) {
  try {
    const adminCheck = await checkIsAdmin()
    
    if (!adminCheck.success || !adminCheck.data?.isAdmin) {
      return { success: false, error: "权限不足：仅管理员可操作" }
    }

    // 验证状态值
    const validStatuses = ["submitted", "approved", "rejected"]
    if (!validStatuses.includes(status)) {
      return { success: false, error: "无效的状态值" }
    }

    // 更新申请状态
    const [updatedClaim] = await db
      .update(claims)
      .set({
        status: status as any,
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      })
      .where(eq(claims.id, claimId))
      .returning({
        id: claims.id,
        status: claims.status,
        adminNotes: claims.adminNotes
      })

    if (!updatedClaim) {
      return { success: false, error: "申请不存在" }
    }

    return {
      success: true,
      message: `申请状态已更新为 ${status}`,
      data: updatedClaim
    }
  } catch (error) {
    console.error("Failed to update claim status:", error)
    return { success: false, error: "更新申请状态失败" }
  }
}
