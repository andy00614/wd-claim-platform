'use client'

import { useEffect, useMemo, useState } from 'react'
import { useActionState } from 'react'
import { updateClaim, uploadItemAttachments } from '@/lib/actions'
import ExpenseForm from '@/app/claims/new/components/ExpenseForm'
import CurrentItems from '@/app/claims/new/components/CurrentItems'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ItemType { id: number; name: string; no: string }
interface Currency { id: number; name: string; code: string }
interface ExistingItem {
  id: number
  date: Date | null
  details: string | null
  amount: string
  rate: string
  sgdAmount: string
  itemTypeName: string
  itemTypeNo: string
  currencyCode: string
}

interface ExpenseItem {
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

interface EditClaimFormProps {
  claimId: number
  itemTypes: ItemType[]
  currencies: Currency[]
  exchangeRates: Record<string, number>
  existingItems: ExistingItem[]
  employeeId: number
}

export default function EditClaimForm({
  claimId,
  itemTypes,
  currencies,
  exchangeRates,
  existingItems,
  employeeId,
}: EditClaimFormProps) {
  const router = useRouter()

  const initialItems: ExpenseItem[] = useMemo(() => (
    existingItems.map((item, index) => {
      const d = item.date ? new Date(item.date) : new Date()
      return {
        id: Date.now() + index,
        date: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
        itemNo: item.itemTypeNo,
        details: item.details || '',
        currency: item.currencyCode,
        amount: parseFloat(item.amount),
        rate: parseFloat(item.rate),
        sgdAmount: parseFloat(item.sgdAmount),
        attachments: [],
      }
    })
  ), [existingItems])

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(initialItems)
  const [isLoading, setIsLoading] = useState(false)

  // 绑定 updateClaim 到当前 claimId
  const updateClaimWithId = updateClaim.bind(null, claimId)
  const [state, formAction] = useActionState(updateClaimWithId, { success: false, error: '' })

  const addExpenseItem = (item: Omit<ExpenseItem, 'id'>) => {
    setExpenseItems(prev => [...prev, { ...item, id: Date.now() }])
  }
  const removeExpenseItem = (id: number) => setExpenseItems(prev => prev.filter(i => i.id !== id))
  const restoreExpenseItem = (item: ExpenseItem) => setExpenseItems(prev => [...prev, { ...item, id: Date.now() }])
  const duplicateExpenseItem = (item: ExpenseItem) => {
    const { id, ...rest } = item
    addExpenseItem(rest)
  }

  // 提交包装，触发隐藏表单提交
  const handleUpdateClick = () => {
    setIsLoading(true)
    ;(document.getElementById('update-form') as HTMLFormElement)?.requestSubmit()
  }

  // 提交成功后：上传 item 级附件 -> 返回详情
  useEffect(() => {
    const run = async () => {
      if (state.success && (state as any).data?.claimId) {
        const inserted = (state as any).data?.insertedItems || []
        const itemsWithAttachments = inserted.map((rec: any, idx: number) => ({
          id: rec.id,
          attachments: expenseItems[idx]?.attachments || [],
        })).filter((x: any) => x.attachments.length > 0)

        if (itemsWithAttachments.length > 0) {
          const up = await uploadItemAttachments(itemsWithAttachments)
          if (!up.success) toast.error(`附件上传失败: ${up.error}`)
        }

        toast.success('申请更新成功！')
        router.push(`/claims/${claimId}`)
      }
      if (state.error) setIsLoading(false)
    }
    run()
  }, [state.success, state.error, (state as any)?.data, expenseItems, router, claimId])

  const totalSGD = expenseItems.reduce((sum, item) => sum + item.sgdAmount, 0)

  const errorText = state.error

  return (
    <div>
      <form id="update-form" action={formAction} className="hidden">
        <input type="hidden" name="employeeId" value={employeeId} />
        <input
          type="hidden"
          name="expenseItems"
          value={JSON.stringify(expenseItems.map(i => ({
            date: i.date,
            itemNo: i.itemNo,
            details: i.details,
            currency: i.currency,
            amount: i.amount,
            rate: i.rate,
            sgdAmount: i.sgdAmount,
          })))}
        />
      </form>

      <ExpenseForm
        itemTypes={itemTypes}
        currencies={currencies}
        exchangeRates={exchangeRates}
        onAddItem={addExpenseItem}
      />

      <CurrentItems
        items={expenseItems}
        onRemoveItem={removeExpenseItem}
        onRestoreItem={restoreExpenseItem}
        onDuplicateItem={duplicateExpenseItem}
        totalSGD={totalSGD}
      />

      {errorText && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorText}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push(`/claims/${claimId}`)}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={handleUpdateClick}
          disabled={expenseItems.length === 0 || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Updating...' : 'Update Claim'}
        </Button>
      </div>
    </div>
  )
}
