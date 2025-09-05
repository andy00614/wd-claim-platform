'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { ExpenseItem } from '../page'
import { submitClaim, uploadClaimFiles, uploadItemAttachments, saveDraft } from '@/lib/actions'
import ExpenseForm from './ExpenseForm'
import CurrentItems from './CurrentItems'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from "sonner"

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
  const [isLoading, setIsLoading] = useState(false)
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
              toast.error(`申请文件上传失败: ${uploadResult.error}`)
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
              toast.error(`项目附件上传失败: ${itemUploadResult.error}`)
            }
          }

          // 清空表单
          setExpenseItems([])
          setAttachedFiles([])
          
          // 根据操作类型显示不同的成功消息
          if (actionType === 'submit') {
            toast.success(`费用申请提交成功！申请ID: ${currentState.data?.claimId}`)
            // 可以重定向到claims页面
            setTimeout(() => {
              window.location.href = '/claims'
            }, 1000)
          } else if (actionType === 'draft') {
            toast.success(`草稿保存成功！草稿ID: ${currentState.data?.claimId}`)
          }
          
          setActionType(null)
          setIsLoading(false)
        } catch (error) {
          console.error('File upload error:', error)
          toast.error('文件上传失败')
          setIsLoading(false)
        }
      }

      handleFileUpload()
    }
  }, [submitState.success, draftState.success, submitState.data, draftState.data, attachedFiles, expenseItems, actionType])

  const totalSGD = expenseItems.reduce((sum, item) => sum + item.sgdAmount, 0)

  // 处理提交申请
  const handleSubmit = async (formData: FormData) => {
    setActionType('submit')
    setIsLoading(true)
    submitFormAction(formData)
  }

  // 处理保存草稿
  const handleSaveDraft = async (formData: FormData) => {
    setActionType('draft')
    setIsLoading(true)
    draftFormAction(formData)
  }

  // 处理按钮点击
  const handleSubmitClick = () => {
    setIsLoading(true);
    (document.getElementById('submit-form') as HTMLFormElement)?.requestSubmit()
  }

  const handleDraftClick = () => {
    setIsLoading(true);
    (document.getElementById('draft-form') as HTMLFormElement)?.requestSubmit()
  }

  const currentError = submitState.error || draftState.error

  return (
    <div>
      {/* Hidden forms for server actions */}
      <form id="submit-form" action={handleSubmit} className="hidden">
        <input type="hidden" name="employeeId" value={employeeId} />
        <input 
          type="hidden" 
          name="expenseItems" 
          value={JSON.stringify(
            expenseItems.map(item => ({
              date: item.date,
              itemNo: item.itemNo,
              details: item.details,
              currency: item.currency,
              amount: item.amount,
              rate: item.rate,
              sgdAmount: item.sgdAmount,
            }))
          )} 
        />
      </form>

      <form id="draft-form" action={handleSaveDraft} className="hidden">
        <input type="hidden" name="employeeId" value={employeeId} />
        <input 
          type="hidden" 
          name="expenseItems" 
          value={JSON.stringify(
            expenseItems.map(item => ({
              date: item.date,
              itemNo: item.itemNo,
              details: item.details,
              currency: item.currency,
              amount: item.amount,
              rate: item.rate,
              sgdAmount: item.sgdAmount,
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
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {currentError}
          </AlertDescription>
        </Alert>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
        <Button 
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            router.refresh()
            router.back()
          }}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        
        <Button 
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleDraftClick}
          disabled={expenseItems.length === 0 || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading && actionType === 'draft' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading && actionType === 'draft' ? 'Saving...' : 'Save as Draft'}
        </Button>
        
        <Button 
          type="button"
          size="lg"
          onClick={handleSubmitClick}
          disabled={expenseItems.length === 0 || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading && actionType === 'submit' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading && actionType === 'submit' ? 'Submitting...' : 'Submit Claim'}
        </Button>
      </div>
    </div>
  )
}