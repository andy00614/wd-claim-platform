'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { updateClaim } from '@/lib/actions'
import ExpenseForm from '@/app/claims/new/components/ExpenseForm'
import CurrentItems from '@/app/claims/new/components/CurrentItems'
import FileUpload from '@/app/claims/new/components/FileUpload'
import SubmitButton from '@/app/claims/new/components/SubmitButton'
import { useRouter } from 'next/navigation'

interface ItemType {
  id: number
  name: string
  no: string
}

interface Currency {
  id: number
  name: string
  code: string
}

interface ExistingItem {
  id: number
  date: Date | null
  note: string | null
  details: string | null
  evidenceNo: string | null
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
  note: string
  details: string
  currency: string
  amount: number
  rate: number
  sgdAmount: number
  evidenceNo: string
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
  employeeId 
}: EditClaimFormProps) {
  const router = useRouter()
  
  // 将现有项目转换为表单格式
  const convertedItems: ExpenseItem[] = existingItems.map((item, index) => {
    const itemDate = item.date ? new Date(item.date) : new Date()
    return {
      id: Date.now() + index, // 使用临时ID
      date: `${(itemDate.getMonth() + 1).toString().padStart(2, '0')}/${itemDate.getDate().toString().padStart(2, '0')}`,
      itemNo: item.itemTypeNo,
      note: item.note || '',
      details: item.details || '',
      currency: item.currencyCode,
      amount: parseFloat(item.amount),
      rate: parseFloat(item.rate),
      sgdAmount: parseFloat(item.sgdAmount),
      evidenceNo: item.evidenceNo || ''
    }
  })

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(convertedItems)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  
  // 绑定updateClaim到当前claimId
  const updateClaimWithId = updateClaim.bind(null, claimId)
  const [state, formAction] = useActionState(updateClaimWithId, { success: false, error: '' })

  const addExpenseItem = (item: Omit<ExpenseItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Date.now()
    }
    setExpenseItems(prev => [...prev, newItem])
  }

  const removeExpenseItem = (id: number) => {
    setExpenseItems(prev => prev.filter(item => item.id !== id))
  }

  // 处理更新成功后的逻辑
  useEffect(() => {
    if (state.success && state.data?.claimId) {
      alert(`申请更新成功！申请ID: CL-2024-${state.data.claimId.toString().padStart(4, '0')}`)
      // 跳转回详情页
      router.push(`/claims/${claimId}`)
    }
  }, [state.success, state.data?.claimId, router, claimId])

  const totalSGD = expenseItems.reduce((sum, item) => sum + item.sgdAmount, 0)

  return (
    <form action={formAction}>
      {/* 隐藏字段 */}
      <input type="hidden" name="employeeId" value={employeeId} />
      <input 
        type="hidden" 
        name="expenseItems" 
        value={JSON.stringify(
          expenseItems.map(item => ({
            date: item.date,
            itemNo: item.itemNo,
            note: item.note,
            details: item.details,
            currency: item.currency,
            amount: item.amount,
            rate: item.rate,
            sgdAmount: item.sgdAmount,
            evidenceNo: item.evidenceNo,
          }))
        )} 
      />

      {/* 费用详情表单 */}
      <ExpenseForm 
        itemTypes={itemTypes}
        currencies={currencies}
        exchangeRates={exchangeRates}
        onAddItem={addExpenseItem} 
      />

      {/* 当前项目列表 */}
      <CurrentItems 
        items={expenseItems}
        onRemoveItem={removeExpenseItem}
        totalSGD={totalSGD}
      />

      {/* 文件上传区域 */}
      <FileUpload 
        files={attachedFiles}
        onFilesChange={setAttachedFiles}
      />

      {/* 错误提示 */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      {/* 提交按钮 */}
      <div className="text-center mt-6">
        <button 
          type="button"
          onClick={() => router.push(`/claims/${claimId}`)}
          className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 mr-4"
        >
          Cancel
        </button>
        <SubmitButton hasItems={expenseItems.length > 0} buttonText="Update Claim" />
      </div>
    </form>
  )
}