import { createClient } from '@/lib/supabase/client'

const STORAGE_BUCKET = 'wd-attachments'

export interface UploadedFileInfo {
  fileName: string
  url: string
  fileSize: string
  fileType: string
}

export async function uploadClaimFile(
  claimId: number,
  file: File
): Promise<UploadedFileInfo> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `claim_${claimId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`
  const filePath = `claims/${claimId}/${fileName}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) {
    throw new Error(`文件上传失败: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

  return {
    fileName: file.name,
    url: urlData.publicUrl,
    fileSize: file.size.toString(),
    fileType: file.type || 'application/octet-stream',
  }
}

export async function uploadItemFile(
  itemId: number,
  file: File
): Promise<UploadedFileInfo> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `item_${itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`
  const filePath = `items/${itemId}/${fileName}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) {
    throw new Error(`文件上传失败: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

  return {
    fileName: file.name,
    url: urlData.publicUrl,
    fileSize: file.size.toString(),
    fileType: file.type || 'application/octet-stream',
  }
}
