'use server'

import { db } from '@/lib/db/drizzle'
import { claims, claimItems, itemType, currency, employees, userEmployeeBind, attachment } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { eq, inArray, and, desc } from 'drizzle-orm'

// 保存草稿
export async function saveDraft(prevState: any, formData: FormData) {
  try {
    const employeeId = parseInt(formData.get('employeeId') as string)
    const expenseItemsJson = formData.get('expenseItems') as string
    const expenseItems = JSON.parse(expenseItemsJson)

    if (!employeeId) {
      return { success: false, error: '缺少员工信息' }
    }

    // 计算总金额
    const totalAmount = expenseItems.reduce((sum: number, item: any) => sum + item.sgdAmount, 0)

    // 在数据库事务中处理
    const result = await db.transaction(async (tx) => {
      // 1. 创建草稿申请记录
      const [newClaim] = await tx.insert(claims).values({
        employeeId,
        totalAmount: totalAmount.toString(),
        status: 'draft' // 保存为草稿状态
      }).returning({ id: claims.id })

      // 2. 如果有expense items，保存它们
      if (expenseItems.length > 0) {
        const itemTypes = await tx.select().from(itemType)
        const currencies = await tx.select().from(currency)
        
        const itemTypeMap = Object.fromEntries(itemTypes.map(it => [it.no, it.id]))
        const currencyMap = Object.fromEntries(currencies.map(c => [c.code, c.id]))

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
          totalAmount,
          insertedItems
        }
      } else {
        return {
          claimId: newClaim.id,
          itemsCount: 0,
          totalAmount,
          insertedItems: []
        }
      }
    })

    return {
      success: true,
      message: '草稿保存成功',
      data: result
    }

  } catch (error) {
    console.error('保存草稿失败:', error)
    return {
      success: false,
      error: '保存草稿失败',
      details: error instanceof Error ? error.message : '未知错误'
    }
  }
}

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
        totalAmount,
        insertedItems
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

// 获取用户的草稿申请列表
export async function getUserDrafts() {
  try {
    const currentEmployee = await getCurrentEmployee()
    
    if (!currentEmployee.success || !currentEmployee.data) {
      return { success: false, error: '用户未登录或未绑定员工' }
    }

    const employeeId = currentEmployee.data.employee.employeeId

    const drafts = await db
      .select({
        id: claims.id,
        totalAmount: claims.totalAmount,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
      })
      .from(claims)
      .where(and(eq(claims.employeeId, employeeId), eq(claims.status, 'draft')))
      .orderBy(claims.updatedAt)

    return {
      success: true,
      data: drafts
    }
  } catch (error) {
    console.error('获取草稿失败:', error)
    return { success: false, error: '获取草稿失败' }
  }
}

// 根据ID加载草稿详情
export async function loadDraft(draftId: number) {
  try {
    const currentEmployee = await getCurrentEmployee()
    
    if (!currentEmployee.success || !currentEmployee.data) {
      return { success: false, error: '用户未登录或未绑定员工' }
    }

    const employeeId = currentEmployee.data.employee.employeeId

    // 查询草稿基本信息
    const [draft] = await db
      .select()
      .from(claims)
      .where(and(eq(claims.id, draftId), eq(claims.employeeId, employeeId), eq(claims.status, 'draft')))
      .limit(1)

    if (!draft) {
      return { success: false, error: '草稿不存在或无权访问' }
    }

    // 查询草稿项目详情
    const draftItems = await db
      .select({
        id: claimItems.id,
        date: claimItems.date,
        note: claimItems.note,
        details: claimItems.details,
        evidenceNo: claimItems.evidenceNo,
        amount: claimItems.amount,
        rate: claimItems.rate,
        sgdAmount: claimItems.sgdAmount,
        itemTypeNo: itemType.no,
        currencyCode: currency.code
      })
      .from(claimItems)
      .innerJoin(itemType, eq(claimItems.type, itemType.id))
      .innerJoin(currency, eq(claimItems.currencyId, currency.id))
      .where(eq(claimItems.claimId, draftId))
      .orderBy(claimItems.date)

    return {
      success: true,
      data: {
        draft,
        items: draftItems
      }
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
    return { success: false, error: '加载草稿失败' }
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
      .orderBy(desc(claims.createdAt))

    // 计算统计信息
    const approved = userClaims.filter(claim => claim.status === 'approved')
    const pending = userClaims.filter(claim => claim.status === 'submitted')
    const drafts = userClaims.filter(claim => claim.status === 'draft')
    
    const totalApproved = approved.reduce((sum, claim) => sum + parseFloat(claim.totalAmount), 0)
    const pendingCount = pending.length
    const draftCount = drafts.length

    return {
      success: true,
      data: {
        claims: userClaims,
        employee: currentEmployee.data.employee,
        stats: {
          totalApproved,
          pendingCount,
          draftCount
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
        employeeId: claims.employeeId,
        adminNotes: claims.adminNotes
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

    // 获取附件信息 - 包括claim级别和item级别的附件
    const itemIds = claimItemsResult.map(item => item.id)
    const [claimAttachmentsResult, itemAttachmentsResult] = await Promise.all([
      getClaimAttachments(claimId),
      itemIds.length > 0 ? db.select().from(attachment).where(inArray(attachment.claimItemId, itemIds)) : Promise.resolve([])
    ])

    const claimAttachments = claimAttachmentsResult.success ? claimAttachmentsResult.data : []
    
    // 为每个item添加其对应的附件
    const itemsWithAttachments = claimItemsResult.map(item => ({
      ...item,
      attachments: itemAttachmentsResult.filter(att => att.claimItemId === item.id)
    }))

    return {
      success: true,
      data: {
        claim,
        items: itemsWithAttachments,
        attachments: claimAttachments,
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

    if (!['submitted', 'draft'].includes(existingClaim.status)) {
      return { success: false, error: '只能编辑待审核或草稿状态的申请' }
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
        employeeId: claims.employeeId,
        employeeName: employees.name,
        employeeCode: employees.employeeCode,
        department: employees.departmentEnum
      })
      .from(claims)
      .innerJoin(employees, eq(claims.employeeId, employees.id))
      .orderBy(desc(claims.createdAt))

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

// 上传文件到Supabase Storage
export async function uploadClaimFiles(claimId: number, files: File[]) {
  try {
    console.log(`[uploadClaimFiles] Starting upload for ${files.length} files, claimId: ${claimId}`)
    
    const currentEmployee = await getCurrentEmployee()
    
    if (!currentEmployee.success || !currentEmployee.data) {
      console.error("[uploadClaimFiles] User not authenticated")
      return { success: false, error: "用户未登录或未绑定员工" }
    }

    const supabase = createAdminClient()
    const uploadedFiles: any[] = []

    for (const file of files) {
      console.log(`[uploadClaimFiles] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`)
      
      // 生成唯一文件名
      const fileExt = file.name.split(".").pop()
      const fileName = `claim_${claimId}_${Date.now()}.${fileExt}`
      const filePath = `claims/${claimId}/${fileName}`

      console.log(`[uploadClaimFiles] Uploading to path: ${filePath}`)

      // 上传文件到Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("wd-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        })

      if (uploadError) {
        console.error("[uploadClaimFiles] Upload error:", uploadError)
        return { success: false, error: `文件上传失败: ${uploadError.message}` }
      }

      console.log(`[uploadClaimFiles] File uploaded successfully: ${filePath}`)

      // 获取文件的公开URL
      const { data: urlData } = supabase.storage
        .from("wd-attachments")
        .getPublicUrl(filePath)

      // 将文件信息保存到数据库
      const [attachmentRecord] = await db
        .insert(attachment)
        .values({
          claimId: claimId,
          claimItemId: null, // 可以后续关联到具体的claimItem
          fileName: file.name,
          url: urlData.publicUrl,
          fileSize: file.size.toString(),
          fileType: file.type
        })
        .returning()

      uploadedFiles.push({
        id: attachmentRecord.id,
        fileName: file.name,
        url: urlData.publicUrl,
        fileSize: file.size,
        fileType: file.type
      })
    }

    return {
      success: true,
      message: `成功上传 ${files.length} 个文件`,
      data: uploadedFiles
    }
  } catch (error) {
    console.error("File upload error:", error)
    return { success: false, error: "文件上传失败" }
  }
}

// 删除文件
export async function deleteClaimFile(attachmentId: number) {
  try {
    const currentEmployee = await getCurrentEmployee()
    
    if (!currentEmployee.success || !currentEmployee.data) {
      return { success: false, error: "用户未登录或未绑定员工" }
    }

    // 查询文件信息
    const [fileRecord] = await db
      .select()
      .from(attachment)
      .where(eq(attachment.id, attachmentId))
      .limit(1)

    if (!fileRecord) {
      return { success: false, error: "文件不存在" }
    }

    const supabase = await createClient()
    
    // 从URL中提取文件路径
    const url = new URL(fileRecord.url)
    const filePath = url.pathname.split("/").slice(-3).join("/") // 获取 claims/claimId/fileName 部分

    // 从Supabase Storage删除文件
    const { error: deleteError } = await supabase.storage
      .from("claim-attachments")
      .remove([filePath])

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return { success: false, error: `文件删除失败: ${deleteError.message}` }
    }

    // 从数据库删除记录
    await db
      .delete(attachment)
      .where(eq(attachment.id, attachmentId))

    return {
      success: true,
      message: "文件删除成功"
    }
  } catch (error) {
    console.error("File delete error:", error)
    return { success: false, error: "文件删除失败" }
  }
}

// 获取申请的附件列表
export async function getClaimAttachments(claimId: number) {
  try {
    const attachments = await db
      .select()
      .from(attachment)
      .where(eq(attachment.claimId, claimId))
      .orderBy(attachment.createdAt)

    return {
      success: true,
      data: attachments
    }
  } catch (error) {
    console.error("Get attachments error:", error)
    return { success: false, error: "获取附件失败" }
  }
}

// 更新申请状态（合并版本，支持管理员和用户操作）
export async function updateClaimStatus(claimId: number, newStatus: 'draft' | 'submitted' | 'approved' | 'rejected', adminNotes?: string) {
  try {
    const currentEmployee = await getCurrentEmployee()
    
    if (!currentEmployee.success || !currentEmployee.data) {
      return { success: false, error: '用户未登录或未绑定员工' }
    }

    const employeeId = currentEmployee.data.employee.employeeId
    const isAdmin = currentEmployee.data.employee.role === 'admin'

    // 验证申请存在
    const [existingClaim] = await db
      .select({ employeeId: claims.employeeId, status: claims.status })
      .from(claims)
      .where(eq(claims.id, claimId))
      .limit(1)

    if (!existingClaim) {
      return { success: false, error: '申请不存在' }
    }

    // 权限验证
    const isOwner = existingClaim.employeeId === employeeId
    
    if (!isOwner && !isAdmin) {
      return { success: false, error: '无权修改此申请' }
    }

    // 状态变更规则验证
    if (!isAdmin) {
      // 非管理员只能将draft状态改为submitted
      if (existingClaim.status !== 'draft' || newStatus !== 'submitted') {
        return { success: false, error: '只能提交草稿状态的申请' }
      }
    } else {
      // 管理员可以设置为approved/rejected，但需要验证状态值
      const validStatuses: Array<'draft' | 'submitted' | 'approved' | 'rejected'> = ['draft', 'submitted', 'approved', 'rejected']
      if (!validStatuses.includes(newStatus)) {
        return { success: false, error: '无效的状态值' }
      }
    }

    // 更新状态
    const [updatedClaim] = await db
      .update(claims)
      .set({
        status: newStatus,
        adminNotes: isAdmin ? adminNotes || null : undefined,
        updatedAt: new Date()
      })
      .where(eq(claims.id, claimId))
      .returning({
        id: claims.id,
        status: claims.status,
        adminNotes: claims.adminNotes
      })

    if (!updatedClaim) {
      return { success: false, error: '更新失败' }
    }

    return {
      success: true,
      message: '状态更新成功',
      data: updatedClaim
    }

  } catch (error) {
    console.error('更新申请状态失败:', error)
    return {
      success: false,
      error: '更新申请状态失败',
      details: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 上传item级别的附件
export async function uploadItemAttachments(claimItemsData: Array<{id: number, attachments?: File[]}>) {
  try {
    console.log(`[uploadItemAttachments] Starting upload for ${claimItemsData.length} items`)
    
    const supabase = createAdminClient()
    const uploadResults: any[] = []

    for (const itemData of claimItemsData) {
      if (!itemData.attachments || itemData.attachments.length === 0) {
        console.log(`[uploadItemAttachments] Skipping item ${itemData.id} - no attachments`)
        continue
      }

      console.log(`[uploadItemAttachments] Processing item ${itemData.id} with ${itemData.attachments.length} files`)

      for (const file of itemData.attachments) {
        console.log(`[uploadItemAttachments] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`)
        
        // 生成唯一文件名
        const fileExt = file.name.split(".").pop()
        const fileName = `item_${itemData.id}_${Date.now()}.${fileExt}`
        const filePath = `items/${itemData.id}/${fileName}`

        console.log(`[uploadItemAttachments] Uploading to path: ${filePath}`)

        // 上传文件到Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("wd-attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          })

        if (uploadError) {
          console.error("[uploadItemAttachments] Upload error:", uploadError)
          return { success: false, error: `文件上传失败: ${uploadError.message}` }
        }

        console.log(`[uploadItemAttachments] File uploaded successfully: ${filePath}`)

        // 获取文件的公开URL
        const { data: urlData } = supabase.storage
          .from("wd-attachments")
          .getPublicUrl(filePath)

        // 将文件信息保存到数据库
        const [attachmentRecord] = await db
          .insert(attachment)
          .values({
            claimItemId: itemData.id,
            fileName: file.name,
            url: urlData.publicUrl,
            fileSize: file.size.toString(),
            fileType: file.type || "application/octet-stream"
          })
          .returning()

        uploadResults.push(attachmentRecord)
      }
    }

    return {
      success: true,
      data: uploadResults,
      message: `成功上传 ${uploadResults.length} 个文件`
    }
  } catch (error) {
    console.error("Item attachments upload error:", error)
    return { 
      success: false, 
      error: "附件上传失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

export async function deleteClaim(claimId: number) {
  try {
    const user = await getCurrentEmployee()
    if (!user.success || !user.data) {
      return { success: false, error: '用户未认证' }
    }

    const result = await db.transaction(async (tx) => {
      // 检查claim是否存在以及是否属于当前用户
      const [claim] = await tx
        .select()
        .from(claims)
        .where(and(eq(claims.id, claimId), eq(claims.employeeId, user.data.employee.employeeId)))

      if (!claim) {
        throw new Error('申请不存在或无权限删除')
      }

      // 只允许删除draft状态的申请
      if (claim.status !== 'draft') {
        throw new Error('只能删除草稿状态的申请')
      }

      // 删除相关附件（先从storage中删除文件，再删除数据库记录）
      const attachments = await tx
        .select()
        .from(attachment)
        .where(eq(attachment.claimId, claimId))

      if (attachments.length > 0) {
        const supabase = createAdminClient()
        
        // 从storage删除文件
        for (const att of attachments) {
          const filePath = att.url.split('/').pop() // 简单提取文件路径
          if (filePath) {
            await supabase.storage
              .from("wd-attachments")
              .remove([`claims/${claimId}/${filePath}`])
          }
        }

        // 删除附件记录
        await tx.delete(attachment).where(eq(attachment.claimId, claimId))
      }

      // 删除claim items的附件
      const itemAttachments = await tx
        .select({ id: attachment.id, url: attachment.url })
        .from(attachment)
        .innerJoin(claimItems, eq(attachment.claimItemId, claimItems.id))
        .where(eq(claimItems.claimId, claimId))

      if (itemAttachments.length > 0) {
        const supabase = createAdminClient()
        
        for (const att of itemAttachments) {
          const filePath = att.url.split('/').pop()
          if (filePath) {
            await supabase.storage
              .from("wd-attachments")
              .remove([filePath])
          }
        }

        await tx.delete(attachment).where(
          inArray(attachment.id, itemAttachments.map(a => a.id))
        )
      }

      // 删除claim items
      await tx.delete(claimItems).where(eq(claimItems.claimId, claimId))

      // 删除claim
      await tx.delete(claims).where(eq(claims.id, claimId))

      return { success: true, message: '申请删除成功' }
    })

    return result
  } catch (error) {
    console.error('删除申请失败:', error)
    return {
      success: false,
      error: '删除申请失败',
      details: error instanceof Error ? error.message : '未知错误'
    }
  }
}
