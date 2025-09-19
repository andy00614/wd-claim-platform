import { db } from '../src/lib/db/drizzle'
import { claims, claimItems, attachment } from '../src/lib/db/schema'
import { createAdminClient } from '../src/lib/supabase/admin'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function clearAllClaimsData() {
  try {
    console.log('🚨 警告：这将删除所有报销单相关数据！')
    console.log('包括：')
    console.log('  - 所有报销申请 (claims)')
    console.log('  - 所有报销项目 (claim_items)')
    console.log('  - 所有相关附件 (attachments)')
    console.log('  - Supabase Storage中的文件')
    console.log('')

    const confirm1 = await askQuestion('确定要继续吗？输入 "YES" 确认: ')
    if (confirm1 !== 'YES') {
      console.log('❌ 操作已取消')
      rl.close()
      process.exit(0)
    }

    const confirm2 = await askQuestion('再次确认：这将永久删除所有数据，无法恢复！输入 "DELETE ALL" 确认: ')
    if (confirm2 !== 'DELETE ALL') {
      console.log('❌ 操作已取消')
      rl.close()
      process.exit(0)
    }

    rl.close()

    console.log('🔄 开始清理数据...')

    // 1. 首先获取所有附件信息（用于删除Storage文件）
    console.log('📋 获取附件信息...')
    const allAttachments = await db.select().from(attachment)
    console.log(`找到 ${allAttachments.length} 个附件`)

    // 2. 删除Supabase Storage中的文件
    if (allAttachments.length > 0) {
      console.log('🗑️  删除Storage文件...')
      const supabase = createAdminClient()

      for (const att of allAttachments) {
        try {
          // 从URL中提取文件路径
          const url = new URL(att.url)
          const pathSegments = url.pathname.split('/')
          const filePath = pathSegments.slice(-3).join('/') // 获取最后3段路径

          const { error } = await supabase.storage
            .from('wd-attachments')
            .remove([filePath])

          if (error) {
            console.log(`⚠️  删除文件失败: ${filePath} - ${error.message}`)
          } else {
            console.log(`✓ 删除文件: ${filePath}`)
          }
        } catch (error) {
          console.log(`⚠️  处理附件失败: ${att.fileName}`, error)
        }
      }
    }

    // 3. 删除数据库数据（按正确顺序）
    console.log('🗄️  删除数据库数据...')

    // 先删除附件记录
    const deletedAttachments = await db.delete(attachment)
    console.log(`✓ 删除了附件记录`)

    // 再删除报销项目
    const deletedItems = await db.delete(claimItems)
    console.log(`✓ 删除了报销项目记录`)

    // 最后删除主申请
    const deletedClaims = await db.delete(claims)
    console.log(`✓ 删除了报销申请记录`)

    console.log('')
    console.log('✅ 所有报销单数据清理完成！')
    console.log('📊 删除统计：')
    console.log(`  - 附件：${allAttachments.length} 个`)
    console.log(`  - Storage文件：已尝试删除`)
    console.log(`  - 数据库记录：已全部清空`)

    process.exit(0)
  } catch (error) {
    console.error('❌ 清理失败:', error)
    rl.close()
    process.exit(1)
  }
}

async function showCurrentStats() {
  try {
    const claimsCount = await db.select().from(claims)
    const itemsCount = await db.select().from(claimItems)
    const attachmentsCount = await db.select().from(attachment)

    console.log('📊 当前数据统计：')
    console.log(`  - 报销申请：${claimsCount.length} 个`)
    console.log(`  - 报销项目：${itemsCount.length} 个`)
    console.log(`  - 附件：${attachmentsCount.length} 个`)
    console.log('')
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 主程序
async function main() {
  await showCurrentStats()
  await clearAllClaimsData()
}

main()