import { db } from '../src/lib/db/drizzle'
import { itemType } from '../src/lib/db/schema'

const itemTypesData = [
  { no: 'A1', name: 'Entertainment', remark: null },
  { no: 'A2', name: 'IT Services & Expense', remark: 'ChatGPT,Computer Accessories' },
  { no: 'A3', name: 'Medical Expenses', remark: null },
  { no: 'B1', name: 'Office Expenses', remark: 'Giant,Daiso,NTUC' },
  { no: 'B2', name: 'Printing & Stationery', remark: null },
  { no: 'B3', name: 'Postage & Courier', remark: null },
  { no: 'C1', name: 'Telephone & Internet', remark: null },
  { no: 'C2', name: 'Transportation', remark: null },
  { no: 'C3', name: 'Travel - International', remark: 'Esim,insurance,allowance' },
  { no: 'C4', name: 'Training & Seminar', remark: null },
  { no: 'D1', name: 'Advertising', remark: null },
  { no: 'E1', name: 'Bank Fees', remark: null },
  { no: 'F1', name: 'Consulting & Account', remark: null },
  { no: 'G1', name: 'Office Equipment', remark: null },
  { no: 'G2', name: 'Computer & Software', remark: null },
  { no: 'G3', name: 'Furniture & Fixtures', remark: null },
  { no: 'H1', name: 'Events & Marketing E', remark: null },
  { no: 'I1', name: 'Gift & Donation', remark: null },
  { no: 'K1', name: 'General Expenses', remark: 'ACRA' },
  { no: 'L1', name: 'Insurance', remark: null },
  { no: 'M1', name: 'Legal & Professional E', remark: null },
  { no: 'N1', name: 'Rent', remark: null },
  { no: 'O1', name: 'Recruitment Expense', remark: null },
  { no: 'P1', name: 'Repairs & Maintenance', remark: null },
  { no: 'Q1', name: 'Staffs\' Welfare', remark: null },
  { no: 'R1', name: 'Due & Subscriptions', remark: 'Xero' },
  { no: 'R2', name: 'Prepayment', remark: null },
  { no: 'R3', name: 'Deposit Paid', remark: null }
]

async function updateItemTypes() {
  try {
    console.log('开始更新item types数据...')

    // 首先删除所有现有数据（如果需要的话）
    // await db.delete(itemType)

    // 批量插入新数据
    for (const item of itemTypesData) {
      try {
        await db.insert(itemType).values(item).onConflictDoUpdate({
          target: itemType.no,
          set: {
            name: item.name,
            remark: item.remark
          }
        })
        console.log(`✓ 插入/更新: ${item.no} - ${item.name}`)
      } catch (error) {
        console.error(`✗ 失败: ${item.no}`, error)
      }
    }

    console.log('✅ 所有item types更新完成!')
    process.exit(0)
  } catch (error) {
    console.error('❌ 更新失败:', error)
    process.exit(1)
  }
}

updateItemTypes()