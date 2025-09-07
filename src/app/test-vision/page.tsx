'use client'

import { useState } from 'react'
import { analyzeReceipt } from '@/app/actions/analyze-receipt'
import type { ExtractedExpenseData } from '@/app/actions/analyze-receipt'
import { fileToBase64, getFileAnalysisType } from '@/lib/file-utils'

export default function TestVisionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ExtractedExpenseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    const fileType = getFileAnalysisType(file)
    if (!fileType) {
      setError('不支持的文件类型。请上传图片或PDF文件。')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setFileName(file.name)

    try {
      // 转换为 base64
      const base64 = await fileToBase64(file)
      
      // 调用 Server Action
      const data = await analyzeReceipt({
        type: fileType,
        data: base64
      })
      
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">测试图片/PDF识别接口</h1>
      
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">
          选择收据/发票（支持图片和PDF）
        </label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          disabled={isLoading}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          支持格式：JPG, PNG, GIF, PDF 等
        </p>
      </div>

      {isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-600">正在识别 {fileName}...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">错误: {error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">识别结果</h2>
          <pre className="bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          <div className="mt-4 space-y-2 text-sm">
            <h3 className="font-semibold">解析的字段：</h3>
            {result.date && <p>📅 日期: {result.date}</p>}
            {result.itemType && <p>📝 类型: {result.itemType}</p>}
            {result.details && <p>📋 详情: {result.details}</p>}
            {result.currency && <p>💱 货币: {result.currency}</p>}
            {result.amount && <p>💰 金额: {result.amount}</p>}
            {result.merchant && <p>🏪 商家: {result.merchant}</p>}
            {result.receiptNumber && <p>🔢 单号: {result.receiptNumber}</p>}
            {result.paymentMethod && <p>💳 支付: {result.paymentMethod}</p>}
          </div>
        </div>
      )}
    </div>
  )
}