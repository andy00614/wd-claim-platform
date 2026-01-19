"use server"

import { updateClaimStatus } from '@/lib/actions'

interface SubmitDraftState {
  success: boolean
  message?: string
  error?: string
}

export async function submitDraftAction(
  prevState: SubmitDraftState,
  formData: FormData
): Promise<SubmitDraftState> {
  const rawDraftId = formData.get('draftId')
  const draftId = Number.parseInt(String(rawDraftId ?? ''), 10)

  if (!Number.isFinite(draftId)) {
    console.error('[submitDraftAction] Invalid draftId', { rawDraftId })
    return { success: false, error: '无效的草稿编号' }
  }

  try {
    const result = await updateClaimStatus(draftId, 'submitted')

    if (result.success) {
      return {
        success: true,
        message: '草稿已成功提交！'
      }
    }

    console.error('[submitDraftAction] Failed to submit draft', {
      draftId,
      error: result.error
    })
    return {
      success: false,
      error: result.error || '提交失败'
    }
  } catch (error) {
    console.error('[submitDraftAction] Unexpected error', {
      draftId,
      error
    })
    return {
      success: false,
      error: '提交失败'
    }
  }
}
