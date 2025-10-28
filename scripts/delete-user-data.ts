import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, and } from 'drizzle-orm'
import { employees, claims, claimItems, attachment } from '../src/lib/db/schema'
import { createAdminClient } from '../src/lib/supabase/admin'

const STORAGE_BUCKET = 'wd-attachments'

async function deleteUserData(employeeName: string) {
  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client, { schema: { employees, claims, claimItems, attachment } })

  try {
    console.log(`\n🔍 查找员工: ${employeeName}`)

    // 1. 查找员工
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.name, employeeName))
      .limit(1)

    if (!employee || employee.length === 0) {
      console.log(`❌ 未找到员工: ${employeeName}`)
      await client.end()
      return
    }

    const employeeId = employee[0].id
    console.log(`✅ 找到员工: ${employee[0].name} (ID: ${employeeId}, Code: ${employee[0].employeeCode})`)

    // 2. 查找该员工的所有claims
    const userClaims = await db
      .select()
      .from(claims)
      .where(eq(claims.employeeId, employeeId))

    console.log(`\n📋 找到 ${userClaims.length} 个申请记录`)

    if (userClaims.length === 0) {
      console.log('✅ 该员工没有任何申请记录，无需删除')
      await client.end()
      return
    }

    const claimIds = userClaims.map(c => c.id)
    console.log(`   Claim IDs: ${claimIds.join(', ')}`)

    // 3. 查找所有相关的claim items
    const userClaimItems = await db
      .select()
      .from(claimItems)
      .where(eq(claimItems.employeeId, employeeId))

    console.log(`\n📝 找到 ${userClaimItems.length} 个费用项目`)

    const itemIds = userClaimItems.map(item => item.id)

    // 4. 查找所有附件（claim级别和item级别）
    let allAttachments: any[] = []

    // 获取所有claim的附件
    for (const claimId of claimIds) {
      const attachs = await db
        .select()
        .from(attachment)
        .where(eq(attachment.claimId, claimId))
      allAttachments = [...allAttachments, ...attachs]
    }

    // 获取所有item的附件
    if (itemIds.length > 0) {
      for (const itemId of itemIds) {
        const itemAttachs = await db
          .select()
          .from(attachment)
          .where(eq(attachment.claimItemId, itemId))
        allAttachments = [...allAttachments, ...itemAttachs]
      }
    }

    console.log(`\n📎 找到 ${allAttachments.length} 个附件`)

    // 5. 从Supabase Storage删除文件
    if (allAttachments.length > 0) {
      console.log('\n🗑️  开始删除Storage中的文件...')
      const supabase = createAdminClient()

      for (const attach of allAttachments) {
        try {
          // 从URL中提取文件路径
          const urlPath = new URL(attach.url).pathname
          const filePath = urlPath.split(`${STORAGE_BUCKET}/`)[1]

          if (filePath) {
            const { error } = await supabase.storage
              .from(STORAGE_BUCKET)
              .remove([filePath])

            if (error) {
              console.log(`   ⚠️  删除文件失败: ${filePath} - ${error.message}`)
            } else {
              console.log(`   ✅ 已删除: ${filePath}`)
            }
          }
        } catch (error) {
          console.log(`   ⚠️  处理附件时出错: ${attach.fileName}`)
        }
      }
    }

    // 6. 删除数据库记录（按顺序：attachments -> claim_items -> claims）
    console.log('\n🗑️  开始删除数据库记录...')

    // 删除附件记录
    if (allAttachments.length > 0) {
      const attachmentIds = allAttachments.map(a => a.id)
      for (const attachId of attachmentIds) {
        await db.delete(attachment).where(eq(attachment.id, attachId))
      }
      console.log(`   ✅ 已删除 ${allAttachments.length} 个附件记录`)
    }

    // 删除claim items
    if (itemIds.length > 0) {
      for (const itemId of itemIds) {
        await db.delete(claimItems).where(eq(claimItems.id, itemId))
      }
      console.log(`   ✅ 已删除 ${itemIds.length} 个费用项目记录`)
    }

    // 删除claims
    for (const claimId of claimIds) {
      await db.delete(claims).where(eq(claims.id, claimId))
    }
    console.log(`   ✅ 已删除 ${claimIds.length} 个申请记录`)

    console.log(`\n✅ 成功删除 ${employeeName} 的所有数据！`)
    console.log(`   - 申请记录: ${claimIds.length}`)
    console.log(`   - 费用项目: ${itemIds.length}`)
    console.log(`   - 附件: ${allAttachments.length}`)

    await client.end()
  } catch (error) {
    console.error('\n❌ 删除失败:', error)
    await client.end()
    throw error
  }
}

// 执行删除
const employeeName = process.argv[2] || 'James (Yip Seng Kong)'

console.log('⚠️  警告：即将删除员工的所有数据！')
console.log(`员工姓名: ${employeeName}`)
console.log('\n开始执行...\n')

deleteUserData(employeeName)
  .then(() => {
    console.log('\n✅ 操作完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 操作失败:', error)
    process.exit(1)
  })
