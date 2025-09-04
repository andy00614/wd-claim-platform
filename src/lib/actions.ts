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
      
      console.log('Available itemTypes:', itemTypes)
      console.log('ItemTypeMap:', itemTypeMap)
      console.log('ExpenseItems:', expenseItems)

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
        department: employees.departmentEnum
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

    console.log(currentEmployee)
    
    if (!currentEmployee.success || !currentEmployee.data) {
      console.log('getCurrentEmployee failed:', currentEmployee.error)
      return { success: false, error: currentEmployee.error || '用户未登录或未绑定员工' }
    }

    const employeeId = currentEmployee.data.employee.employeeId
    console.log('Looking for claims for employeeId:', employeeId)

    // 查询用户的申请记录
    const userClaims = await db
      .select({
        id: claims.id,
        status: claims.status,
        totalAmount: claims.totalAmount,
        createdAt: claims.createdAt,
      })
      .from(claims)
      .where(eq(claims.employeeId, employeeId))
      .orderBy(claims.createdAt)

    console.log('Found claims:', userClaims)

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