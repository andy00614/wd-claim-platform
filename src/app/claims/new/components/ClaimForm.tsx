'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { ExpenseItem } from '../page'
import { submitClaim, uploadClaimFiles, uploadItemAttachments, saveDraft } from '@/lib/actions'
import ExpenseForm from './ExpenseForm'
import CurrentItems from './CurrentItems'
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

interface ClaimFormProps {
  itemTypes: ItemType[]
  currencies: Currency[]
  exchangeRates: Record<string, number>
  employeeId: number
}

export default function ClaimForm({ itemTypes, currencies, exchangeRates, employeeId }: ClaimFormProps) {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [actionType, setActionType] = useState<'submit' | 'draft' | null>(null)
  const [submitState, submitFormAction] = useActionState(submitClaim, { success: false, error: '' })
  const [draftState, draftFormAction] = useActionState(saveDraft, { success: false, error: '' })
  const router = useRouter()

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

  // 处理提交成功后的逻辑
  useEffect(() => {
    const currentState = actionType === 'submit' ? submitState : draftState
    
    if (currentState.success && currentState.data?.claimId && currentState.data?.insertedItems) {
      const handleFileUpload = async () => {
        try {
          // 1. 上传claim级别的附件（如果有）
          if (attachedFiles.length > 0) {
            const uploadResult = await uploadClaimFiles(currentState.data.claimId, attachedFiles)
            if (!uploadResult.success) {
              alert(`申请文件上传失败: ${uploadResult.error}`)
            }
          }

          // 2. 上传item级别的附件
          const itemsWithAttachments = currentState.data.insertedItems.map((insertedItem: any, index: number) => ({
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
          
          // 根据操作类型显示不同的成功消息
          if (actionType === 'submit') {
            alert(`费用申请提交成功！申请ID: ${currentState.data?.claimId}`)
            // 可以重定向到claims页面
            window.location.href = '/claims'
          } else if (actionType === 'draft') {
            alert(`草稿保存成功！草稿ID: ${currentState.data?.claimId}`)
          }
          
          setActionType(null)
        } catch (error) {
          console.error('File upload error:', error)
          alert('文件上传失败')
        }
      }

      handleFileUpload()
    }
  }, [submitState.success, draftState.success, submitState.data, draftState.data, attachedFiles, expenseItems, actionType])

  const totalSGD = expenseItems.reduce((sum, item) => sum + item.sgdAmount, 0)

  // 处理提交申请
  const handleSubmit = (formData: FormData) => {
    setActionType('submit')
    submitFormAction(formData)
  }

  // 处理保存草稿
  const handleSaveDraft = (formData: FormData) => {
    setActionType('draft')
    draftFormAction(formData)
  }

  const currentError = submitState.error || draftState.error

  return (
    <div>
      <form id="submit-form" action={handleSubmit}>
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
      </form>

      <form id="draft-form" action={handleSaveDraft}>
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
      </form>

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

      {/* 错误提示 */}
      {currentError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {currentError}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="text-center mt-6 space-x-4">
        <button 
          type="button"
          onClick={() => {
            router.refresh()
            router.back()
          }}
          className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <button 
          type="button"
          onClick={() => (document.getElementById('draft-form') as HTMLFormElement)?.requestSubmit()}
          className="px-4 py-2 border border-gray-400 bg-gray-100 hover:bg-gray-200"
          disabled={expenseItems.length === 0}
        >
          Save as Draft
        </button>
        
        <button 
          type="button"
          onClick={() => (document.getElementById('submit-form') as HTMLFormElement)?.requestSubmit()}
          disabled={expenseItems.length === 0}
          className={`px-6 py-2 text-white ${
            expenseItems.length === 0
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-black hover:bg-gray-800'
          }`}
        >
          Submit Claim
        </button>
      </div>
    </div>
  )
}