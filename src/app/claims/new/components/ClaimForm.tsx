'use client'

import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from "sonner"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { saveDraft, submitClaim, updateClaim, saveAttachmentRecords } from '@/lib/actions'
import { uploadClaimFile, uploadItemFile } from '@/lib/upload'
import { formatClaimId } from '@/lib/utils'
import { generateTempId } from '@/lib/idGenerator'
import type { ClaimAttachment, ExpenseItem } from '../page'
import CurrentItems from './CurrentItems'
import ExpenseForm from './ExpenseForm'

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
  mode?: 'create' | 'edit'
  initialItems?: ExpenseItem[]
  claimId?: number
  existingAttachments?: ClaimAttachment[]
}

export default function ClaimForm({
  itemTypes,
  currencies,
  exchangeRates,
  employeeId,
  mode = 'create',
  initialItems = [],
  claimId,
  existingAttachments = []
}: ClaimFormProps) {
  const isEditMode = mode === 'edit' && typeof claimId === 'number'
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(initialItems)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [actionType, setActionType] = useState<'submit' | 'draft' | 'update' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitState, submitFormAction] = useActionState(submitClaim, { success: false, error: '' })
  const [draftState, draftFormAction] = useActionState(saveDraft, { success: false, error: '' })
  const [isDraftPending, startDraftTransition] = useTransition()
  const updateActionHandler = updateClaim.bind(null, claimId ?? 0)
  const [updateState, updateFormAction] = useActionState(updateActionHandler, { success: false, error: '' })
  const router = useRouter()

  const addExpenseItem = (item: Omit<ExpenseItem, 'id'>) => {
    const newItem = {
      ...item,
      id: generateTempId() // 使用负数临时 ID
    }
    setExpenseItems(prev => [...prev, newItem])
  }

  const handleEditItem = (updatedItem: ExpenseItem) => {
    setExpenseItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)))
  }

  useEffect(() => {
    if (isEditMode && initialItems.length > 0) {
      setExpenseItems(prev => {
        // 只有当数据真正不同时才更新
        if (JSON.stringify(prev) !== JSON.stringify(initialItems)) {
          return initialItems
        }
        return prev
      })
    }
  }, [isEditMode])

  const removeExpenseItem = (id: number) => {
    setExpenseItems(prev => prev.filter(item => item.id !== id))
  }

  // 处理提交成功后的逻辑
  useEffect(() => {
    if (isEditMode) return
    const currentState = actionType === 'submit' ? submitState : draftState

    // 处理 server action 错误 - 重置 loading 状态
    if (currentState.error) {
      toast.error(currentState.error)
      setIsLoading(false)
      setActionType(null)
      return
    }

    if (currentState.success && currentState.data?.claimId && currentState.data?.insertedItems) {
      const handleFileUpload = async () => {
        try {
          const claimId = currentState.data.claimId
          const allRecords: Array<{
            claimId?: number | null
            claimItemId?: number | null
            fileName: string
            url: string
            fileSize: string
            fileType: string
          }> = []

          // 1. 客户端直传 claim 级别附件到 Supabase Storage
          if (attachedFiles.length > 0) {
            const results = await Promise.all(
              attachedFiles.map((file) => uploadClaimFile(claimId, file))
            )
            allRecords.push(...results.map((r) => ({ ...r, claimId, claimItemId: null })))
          }

          // 2. 客户端直传 item 级别附件
          const insertedItems = Array.isArray(currentState.data.insertedItems)
            ? currentState.data.insertedItems as Array<{ id: number }>
            : []

          for (const [index, insertedItem] of insertedItems.entries()) {
            const itemFiles = (expenseItems[index]?.attachments || []).filter(
              (a): a is File => a instanceof File
            )
            if (itemFiles.length === 0) continue

            const results = await Promise.all(
              itemFiles.map((file) => uploadItemFile(insertedItem.id, file))
            )
            allRecords.push(
              ...results.map((r) => ({ ...r, claimId: null, claimItemId: insertedItem.id }))
            )
          }

          // 3. 批量保存附件元数据到数据库
          if (allRecords.length > 0) {
            const saveResult = await saveAttachmentRecords(allRecords)
            if (!saveResult.success) {
              toast.error(`附件记录保存失败: ${saveResult.error}`)
            }
          }

          setExpenseItems([])
          setAttachedFiles([])

          if (actionType === 'submit') {
            toast.success(`费用申请提交成功！申请ID: ${currentState.data?.claimId}`)
            setTimeout(() => {
              window.location.href = '/claims'
            }, 1000)
          } else if (actionType === 'draft') {
            toast.success(`草稿保存成功！草稿ID: ${currentState.data?.claimId}`)
            setTimeout(() => {
              router.push('/claims')
            }, 1000)
          }

        } catch (error) {
          console.error('File upload error:', error)
          toast.error('文件上传失败')
        } finally {
          setActionType(null)
          setIsLoading(false)
        }
      }

      handleFileUpload()
    }
  }, [submitState.success, submitState.error, draftState.success, draftState.error, actionType, isEditMode])

  useEffect(() => {
    if (!isEditMode) return

    if (updateState.success && updateState.data?.claimId) {
      const handlePostUpdate = async () => {
        try {
          const claimId = updateState.data.claimId
          const allRecords: Array<{
            claimId?: number | null
            claimItemId?: number | null
            fileName: string
            url: string
            fileSize: string
            fileType: string
          }> = []

          // 1. 客户端直传 claim 级别附件
          if (attachedFiles.length > 0) {
            const results = await Promise.all(
              attachedFiles.map((file) => uploadClaimFile(claimId, file))
            )
            allRecords.push(...results.map((r) => ({ ...r, claimId, claimItemId: null })))
          }

          // 2. 客户端直传 item 级别新附件
          const insertedItems = Array.isArray(updateState.data.insertedItems)
            ? updateState.data.insertedItems as Array<{ id: number }>
            : []

          for (const [index, insertedItem] of insertedItems.entries()) {
            const expenseItem = expenseItems[index]
            if (!expenseItem) continue

            const newFiles = (expenseItem.attachments || []).filter(
              (a): a is File => a instanceof File
            )
            if (newFiles.length === 0) continue

            const results = await Promise.all(
              newFiles.map((file) => uploadItemFile(insertedItem.id, file))
            )
            allRecords.push(
              ...results.map((r) => ({ ...r, claimId: null, claimItemId: insertedItem.id }))
            )
          }

          // 3. 批量保存附件元数据
          if (allRecords.length > 0) {
            const saveResult = await saveAttachmentRecords(allRecords)
            if (!saveResult.success) {
              toast.error(`附件记录保存失败: ${saveResult.error}`)
            }
          }

          toast.success(`Claim updated! ID: ${formatClaimId(updateState.data.claimId)}`)
          router.push(`/claims/${updateState.data.claimId}`)
        } catch (error) {
          console.error('Update uploads failed:', error)
          toast.error('文件上传失败')
        } finally {
          setIsLoading(false)
          setActionType(null)
        }
      }

      void handlePostUpdate()
      return
    }

    if (updateState.error) {
      toast.error(updateState.error)
      setIsLoading(false)
      setActionType(null)
    }
  }, [
    isEditMode,
    updateState.success,
    updateState.data?.claimId,
    updateState.data?.insertedItems,
    updateState.error,
    attachedFiles,
    expenseItems,
    router
  ])

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
    startDraftTransition(() => {
      draftFormAction(formData)
    })
  }

  // 处理按钮点击
  const handleSubmitClick = () => {
    if (isEditMode) {
      setActionType('update')
      setIsLoading(true)
      ;(document.getElementById('update-form') as HTMLFormElement)?.requestSubmit()
      return
    }

    setIsLoading(true)
    ;(document.getElementById('submit-form') as HTMLFormElement)?.requestSubmit()
  }

  const handleDraftClick = () => {
    if (isEditMode || expenseItems.length === 0 || isLoading) return
    const formData = new FormData()
    formData.append('employeeId', String(employeeId))
    formData.append('expenseItems', expenseItemsPayload)
    void handleSaveDraft(formData)
  }

  const currentError = isEditMode ? updateState.error : (submitState.error || draftState.error)

  const expenseItemsPayload = useMemo(() => (
    JSON.stringify(
      expenseItems.map(item => ({
        date: item.date,
        itemNo: item.itemNo,
        details: item.details,
        currency: item.currency,
        amount: item.amount,
        rate: item.rate,
        sgdAmount: item.sgdAmount,
        existingAttachments: (item.existingAttachments || []).map(attachment => ({
          fileName: attachment.fileName,
          url: attachment.url,
          fileSize: attachment.fileSize,
          fileType: attachment.fileType,
        })),
      }))
    )
  ), [expenseItems])

  return (
    <div>
      {/* Hidden forms for server actions */}
      {!isEditMode && (
        <>
          <form id="submit-form" action={handleSubmit} className="hidden">
            <input type="hidden" name="employeeId" value={employeeId} />
            <input 
              type="hidden" 
              name="expenseItems" 
              value={expenseItemsPayload} 
            />
          </form>

        </>
      )}

      {isEditMode && (
        <form id="update-form" action={updateFormAction} className="hidden">
          <input 
            type="hidden" 
            name="expenseItems" 
            value={expenseItemsPayload} 
          />
        </form>
      )}

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
        onEditItem={handleEditItem}
        totalSGD={totalSGD}
        itemTypes={itemTypes}
        currencies={currencies}
        exchangeRates={exchangeRates}
        existingAttachments={existingAttachments}
        isEditMode={isEditMode}
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

        {!isEditMode && (
          <Button 
            type="button"
            variant="outline"
            size="lg"
            onClick={handleDraftClick}
            disabled={expenseItems.length === 0 || isLoading || isDraftPending}
            className="w-full sm:w-auto gap-2 px-6 font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm hover:bg-amber-100 hover:text-amber-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {(isLoading || isDraftPending) && actionType === 'draft' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {(isLoading || isDraftPending) && actionType === 'draft' ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save as Draft</span>
              </>
            )}
          </Button>
        )}
        
        <Button 
          type="button"
          size="lg"
          onClick={handleSubmitClick}
          disabled={expenseItems.length === 0 || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading && actionType === 'submit' && !isEditMode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading && actionType === 'update' && isEditMode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode
            ? (isLoading && actionType === 'update' ? 'Updating...' : 'Update Claim')
            : (isLoading && actionType === 'submit' ? 'Submitting...' : 'Submit Claim')}
        </Button>
      </div>
    </div>
  )
}
