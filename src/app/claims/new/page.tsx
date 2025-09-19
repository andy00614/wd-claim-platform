import { getFormInitData, getCurrentEmployee, getClaimDetails } from '@/lib/actions'
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

interface NewClaimPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function NewClaimPage({ searchParams }: NewClaimPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const rawClaimId = resolvedSearchParams?.claimId
  const claimIdParam = typeof rawClaimId === 'string' ? rawClaimId : Array.isArray(rawClaimId) ? rawClaimId[0] : undefined
  const claimId = claimIdParam ? parseInt(claimIdParam, 10) : null

  const [initData, currentEmployee, claimDetails] = await Promise.all([
    getFormInitData(),
    getCurrentEmployee(),
    claimId ? getClaimDetails(claimId) : Promise.resolve(null)
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

  let initialItems: ExpenseItem[] | undefined
  if (claimDetails && typeof claimId === 'number') {
    if (!claimDetails.success || !claimDetails.data) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-600 mb-4">Failed to load claim</h1>
            <p className="text-gray-600">{claimDetails.error}</p>
            <a href="/claims" className="text-blue-600 hover:underline mt-2 block">
              Back to Claims
            </a>
          </div>
        </div>
      )
    }

    initialItems = claimDetails.data.items.map((item, index) => {
      const itemDate = item.date ? new Date(item.date) : new Date()
      return {
        id: Date.now() + index,
        date: `${(itemDate.getMonth() + 1).toString().padStart(2, '0')}/${itemDate.getDate().toString().padStart(2, '0')}`,
        itemNo: item.itemTypeNo,
        details: item.details || '',
        currency: item.currencyCode,
        amount: parseFloat(item.amount),
        rate: parseFloat(item.rate),
        sgdAmount: parseFloat(item.sgdAmount),
        attachments: []
      }
    })
  }

  return (
    <ClaimForm 
      itemTypes={initData.data.itemTypes}
      currencies={initData.data.currencies}
      exchangeRates={initData.data.exchangeRates}
      employeeId={currentEmployee.data.employee.employeeId}
      mode={claimId ? 'edit' : 'create'}
      initialItems={initialItems}
      claimId={claimId ?? undefined}
    />
  )
}
