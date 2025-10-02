import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { itemType } from '../src/lib/db/schema'
import { sql } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const client = postgres(connectionString)
const db = drizzle(client)

// Mapping based on the provided image
// itemNo: current 'no' field value -> xeroCode: actual Xero code number
const itemMapping: Record<string, string> = {
  'A1': '420',  // Entertainment
  'A2': '439',  // IT Services & Expense
  'A3': '449',  // Medical Expenses
  'B1': '453',  // Office Expenses
  'B2': '461',  // Printing & Stationery
  'B3': '463',  // Postage & Courier
  'C1': '489',  // Telephone & Internet
  'C2': '493',  // Transportation
  'C3': '494',  // Travel - International
  'C4': '495',  // Training & Seminar
  'D1': '400',  // Advertising
  'E1': '404',  // Bank Fees
  'F1': '408',  // Consulting & Account
  'G1': '710',  // Office Equipment
  'G2': '720',  // Computer & Software
  'G3': '730',  // Furniture & Fixtures
  'H1': '422',  // Events & Marketing E
  'I1': '425',  // Gift & Donation
  'K1': '429',  // General Expenses
  'L1': '433',  // Insurance
  'M1': '441',  // Legal & Professional E
  'N1': '469',  // Rent
  'O1': '470',  // Recruitment Expense
  'P1': '473',  // Repairs & Maintenance
  'Q1': '480',  // Staffs' Welfare
  'R1': '485',  // Due & Subscriptions
  'R2': '620',  // Prepayment
  'R3': '615',  // Deposit Paid
}

async function migrateItemNo() {
  console.log('Starting migration...')

  try {
    // Step 1: Add columns as nullable first
    console.log('Step 1: Adding item_no and xero_code columns...')
    await db.execute(sql`ALTER TABLE item_type ADD COLUMN IF NOT EXISTS item_no varchar(10)`)
    await db.execute(sql`ALTER TABLE item_type ADD COLUMN IF NOT EXISTS xero_code varchar(10)`)
    console.log('✓ Columns added')

    // Step 2: Get all existing records
    console.log('\nStep 2: Fetching existing records...')
    const items = await db.select().from(itemType)
    console.log(`Found ${items.length} records`)

    // Step 3: Update records
    console.log('\nStep 3: Updating records with item_no and xero_code values...')
    for (const item of items) {
      const currentNo = item.no // This contains A1, A2, etc.
      const xeroCode = itemMapping[currentNo]

      if (!xeroCode) {
        console.warn(`⚠️  No xero_code mapping found for item ${item.id} (${currentNo}). Skipping...`)
        continue
      }

      await db.execute(
        sql`UPDATE item_type SET item_no = ${currentNo}, xero_code = ${xeroCode} WHERE id = ${item.id}`
      )
      console.log(`✓ Updated: ID=${item.id}, item_no=${currentNo}, xero_code=${xeroCode}, name=${item.name}`)
    }

    // Step 4: Make the columns NOT NULL and add unique constraints
    console.log('\nStep 4: Adding NOT NULL constraints and unique indexes...')
    await db.execute(sql`ALTER TABLE item_type ALTER COLUMN item_no SET NOT NULL`)
    await db.execute(sql`ALTER TABLE item_type ALTER COLUMN xero_code SET NOT NULL`)
    console.log('✓ Added NOT NULL constraints')

    await db.execute(sql`ALTER TABLE item_type ADD CONSTRAINT item_type_item_no_unique UNIQUE(item_no)`)
    await db.execute(sql`ALTER TABLE item_type ADD CONSTRAINT item_type_xero_code_unique UNIQUE(xero_code)`)
    console.log('✓ Added unique constraints')

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

migrateItemNo()
