import { db } from '@/lib/db/drizzle'
import { employees, itemType, currency } from '@/lib/db/schema'

async function seedData() {
  console.log('🌱 Seeding data...')

  try {
    // 插入测试员工数据
    const employeeData = [
      {
        name: 'Andy Zhang',
        employeeCode: 1,
        departmentEnum: 'Tech Department' as const,
      },
      {
        name: 'Lucas Zhao', 
        employeeCode: 2,
        departmentEnum: 'HR Department' as const,
      },
      {
        name: 'Celine Chiong',
        employeeCode: 3, 
        departmentEnum: 'Tech Department' as const,
      },
      {
        name: 'Eve Li',
        employeeCode: 4,
        departmentEnum: 'Marketing Department' as const,
      },
    ]

    await db.insert(employees).values(employeeData).onConflictDoNothing()
    console.log('✅ Employee data seeded')

    // 插入费用类型数据
    const itemTypeData = [
      { name: 'Entertainment', no: 'A1' },
      { name: 'IT Services', no: 'A2' },
      { name: 'Medical', no: 'A3' },
      { name: 'Office', no: 'B1' },
      { name: 'Printing', no: 'B2' },
      { name: 'Courier', no: 'B3' },
      { name: 'Telephone', no: 'C1' },
      { name: 'Transportation', no: 'C2' },
      { name: 'Travel International', no: 'C3' },
      { name: 'Training', no: 'C4' },
    ]

    await db.insert(itemType).values(itemTypeData).onConflictDoNothing()
    console.log('✅ Item type data seeded')

    // 插入货币数据
    const currencyData = [
      { name: 'Singapore Dollar', code: 'SGD' },
      { name: 'Thai Baht', code: 'THB' },
      { name: 'Philippine Peso', code: 'PHP' },
      { name: 'Vietnam Dong', code: 'VND' },
      { name: 'Chinese Yuan', code: 'CNY' },
      { name: 'Indian Rupee', code: 'INR' },
      { name: 'Indonesian Rupiah', code: 'IDR' },
      { name: 'US Dollar', code: 'USD' },
      { name: 'Malaysian Ringgit', code: 'MYR' },
    ]

    await db.insert(currency).values(currencyData).onConflictDoNothing()
    console.log('✅ Currency data seeded')

    console.log('🎉 All data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}

// 运行种子数据脚本
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedData }