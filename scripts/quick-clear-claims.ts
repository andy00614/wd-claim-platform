import { db } from '../src/lib/db/drizzle'
import { claims, claimItems, attachment } from '../src/lib/db/schema'

async function quickClearClaims() {
  try {
    console.log('🚀 快速清理报销单数据（开发环境使用）')

    // 获取统计信息
    const claimsCount = await db.select().from(claims)
    const itemsCount = await db.select().from(claimItems)
    const attachmentsCount = await db.select().from(attachment)

    console.log('删除前统计：')
    console.log(`  - 报销申请：${claimsCount.length} 个`)
    console.log(`  - 报销项目：${itemsCount.length} 个`)
    console.log(`  - 附件：${attachmentsCount.length} 个`)

    // 删除数据（按正确顺序）
    console.log('\n🗑️  开始删除...')

    // 1. 删除附件记录
    await db.delete(attachment)
    console.log('✓ 清空附件表')

    // 2. 删除报销项目
    await db.delete(claimItems)
    console.log('✓ 清空报销项目表')

    // 3. 删除主申请
    await db.delete(claims)
    console.log('✓ 清空报销申请表')

    console.log('\n✅ 快速清理完成！')
    console.log('⚠️  注意：Supabase Storage中的文件未删除，如需删除请使用完整版脚本')

  } catch (error) {
    console.error('❌ 快速清理失败:', error)
    process.exit(1)
  }
}

quickClearClaims()