import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'

async function addApprovedAtColumn() {
  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client)

  try {
    console.log('正在添加 approved_at 字段...')

    // 检查字段是否已存在
    const checkResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='claims' AND column_name='approved_at';
    `)

    if (checkResult.length > 0) {
      console.log('✅ approved_at 字段已存在，无需添加')
      await client.end()
      return
    }

    // 添加 approved_at 字段
    await db.execute(sql`
      ALTER TABLE claims ADD COLUMN approved_at timestamp;
    `)

    console.log('✅ approved_at 字段添加成功！')
    console.log('现在可以正常使用 admin 页面了')

    await client.end()
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    await client.end()
    throw error
  }
}

addApprovedAtColumn()
  .then(() => {
    console.log('迁移完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('迁移失败:', error)
    process.exit(1)
  })
