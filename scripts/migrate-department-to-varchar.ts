import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'

async function migrateDepartmentField() {
  const client = postgres(process.env.DATABASE_URL!)
  const db = drizzle(client)

  try {
    console.log('🔄 Converting department field from enum to varchar...')

    await db.execute(sql`
      ALTER TABLE employees ALTER COLUMN department SET DATA TYPE varchar(100);
    `)

    console.log('✅ Migration completed successfully!')
    console.log('   Department field is now varchar(100) and can accept custom values')

    await client.end()
  } catch (error) {
    console.error('❌ Migration failed:', error)
    await client.end()
    throw error
  }
}

migrateDepartmentField()
  .then(() => {
    console.log('\n✅ Done')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
