import { getFormInitData, getCurrentEmployee } from '@/lib/actions'
import ClaimForm from './components/ClaimForm'

export interface ExpenseItem {
  id: number
  date: string
  itemNo: string
  details: string
  currency: string
  amount: number
  rate: number
  sgdAmount: number
  attachments?: File[]
}

export default async function NewClaimPage() {
  // 在服务器端获取初始数据和用户信息
  const [initData, currentEmployee] = await Promise.all([
    getFormInitData(),
    getCurrentEmployee()
  ])
  
  if (!initData.success || !initData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">数据加载失败</h1>
          <p className="text-gray-600">{initData.error}</p>
        </div>
      </div>
    )
  }

  if (!currentEmployee.success || !currentEmployee.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">用户信息加载失败</h1>
          <p className="text-gray-600">{currentEmployee.error}</p>
          <a href="/login" className="text-blue-600 hover:underline mt-2 block">
            请先登录
          </a>
        </div>
      </div>
    )
  }

  return (
    <ClaimForm 
      itemTypes={initData.data.itemTypes}
      currencies={initData.data.currencies}
      exchangeRates={initData.data.exchangeRates}
      employeeId={currentEmployee.data.employee.employeeId}
    />
  )
}