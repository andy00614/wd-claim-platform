'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface SubmitDraftFormProps {
  draftId: number
  submitDraftAction: (prevState: any, formData: FormData) => Promise<{
    success: boolean
    message?: string
    error?: string
  }>
}

export default function SubmitDraftForm({ draftId, submitDraftAction }: SubmitDraftFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(submitDraftAction, { success: false, error: '' })

  useEffect(() => {
    if (state.success) {
      alert('草稿已成功提交为费用申请！')
      router.push('/claims')
    }
  }, [state.success, router])

  return (
    <div className="bg-white border border-gray-300 p-6">
      <h3 className="text-lg font-semibold mb-4">Submit Draft</h3>
      <p className="text-sm text-gray-600 mb-6">
        Are you sure you want to submit this draft as a formal expense claim? 
        Once submitted, it will be sent for approval and cannot be edited.
      </p>

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex gap-4">
        <input type="hidden" name="draftId" value={draftId} />
        
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          Submit Claim
        </button>
      </form>
    </div>
  )
}
