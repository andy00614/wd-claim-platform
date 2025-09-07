// 客户端文件处理工具函数

/**
 * 将 File 对象转换为 base64 字符串
 * 只能在客户端使用
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = error => reject(error)
  })
}

/**
 * 检查文件类型是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * 检查文件类型是否为 PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf'
}

/**
 * 获取文件类型用于 AI 分析
 */
export function getFileAnalysisType(file: File): 'image' | 'pdf' | null {
  if (isImageFile(file)) return 'image'
  if (isPDFFile(file)) return 'pdf'
  return null
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}