'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { ExpenseItem } from '../page'
import { submitClaim, uploadClaimFiles, uploadItemAttachments } from '@/lib/actions'
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
  employeeId: number
}

export default function ClaimForm({ itemTypes, currencies, exchangeRates, employeeId }: ClaimFormProps) {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [state, formAction] = useActionState(submitClaim, { success: false, error: '' })

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

  // 处理提交成功后的清空逻辑和文件上传
  useEffect(() => {
    if (state.success && state.data?.claimId && state.data?.insertedItems) {
      const handleFileUpload = async () => {
        try {
          // 1. 上传claim级别的附件（如果有）
          if (attachedFiles.length > 0) {
            const uploadResult = await uploadClaimFiles(state.data.claimId, attachedFiles)
            if (!uploadResult.success) {
              alert(`申请文件上传失败: ${uploadResult.error}`)
            }
          }

          // 2. 上传item级别的附件
          const itemsWithAttachments = state.data.insertedItems.map((insertedItem: any, index: number) => ({
            id: insertedItem.id,
            attachments: expenseItems[index]?.attachments || []
          })).filter(item => item.attachments.length > 0)

          if (itemsWithAttachments.length > 0) {
            const itemUploadResult = await uploadItemAttachments(itemsWithAttachments)
            if (!itemUploadResult.success) {
              alert(`项目附件上传失败: ${itemUploadResult.error}`)
            }
          }

          // 清空表单
          setExpenseItems([])
          setAttachedFiles([])
          // alert(`费用申请提交成功！申请ID: ${state.data?.claimId}`)
        } catch (error) {
          console.error('File upload error:', error)
          alert('文件上传失败')
        }
      }

      handleFileUpload()
    }
  }, [state.success, state.data?.claimId, state.data?.insertedItems, attachedFiles, expenseItems])

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
      {/* <FileUpload 
        files={attachedFiles}
        onFilesChange={setAttachedFiles}
      /> */}

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