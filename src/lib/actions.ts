'use server'

import { db } from '@/lib/db/drizzle'
import { claims, claimItems, itemType, currency } from '@/lib/db/schema'

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

    // 汇率数据（模拟数据，可以后续替换为真实汇率API）
    const exchangeRates = {
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