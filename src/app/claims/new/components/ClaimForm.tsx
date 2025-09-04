'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { ExpenseItem } from '../page'
import { submitClaim } from '@/lib/actions'
import ExpenseForm from './ExpenseForm'
import CurrentItems from './CurrentItems'
import FileUpload from './FileUpload'
import SubmitButton from './SubmitButton'

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

interface ClaimFormProps {
  itemTypes: ItemType[]
  currencies: Currency[]
  exchangeRates: Record<string, number>
}

export default function ClaimForm({ itemTypes, currencies, exchangeRates }: ClaimFormProps) {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [state, formAction] = useFormState(submitClaim, { success: false, error: '' })

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

  // 处理提交成功后的清空逻辑
  if (state.success && state.data?.claimId) {
    // 提交成功后清空表单（只执行一次）
    setTimeout(() => {
      setExpenseItems([])
      setAttachedFiles([])
      alert(`费用申请提交成功！申请ID: ${state.data?.claimId}`)
    }, 100)
  }

  const totalSGD = expenseItems.reduce((sum, item) => sum + item.sgdAmount, 0)

  return (
    <form action={formAction}>
      {/* 隐藏字段 */}
      <input type="hidden" name="employeeId" value="3" />
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
      <SubmitButton hasItems={expenseItems.length > 0} />
    </form>
  )
}