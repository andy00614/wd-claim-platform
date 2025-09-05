'use client'

import { useState } from 'react'
import { ExpenseItem } from '../page'

interface AIAssistantProps {
  onExtractData: (item: Omit<ExpenseItem, 'id'>) => void
}

export default function AIAssistant({ onExtractData }: AIAssistantProps) {
  const [selectedMethod, setSelectedMethod] = useState<'text' | 'voice' | 'image' | null>(null)
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcessText = () => {
    if (!textInput.trim()) {
      alert('请输入费用描述')
      return
    }

    setIsProcessing(true)
    
    // 模拟AI处理
    setTimeout(() => {
      // 简单的文本解析逻辑
      const mockExtraction = {
        date: new Date().toISOString().split('T')[0],
        itemNo: 'C2', // 假设是交通费
        note: '出租车费用',
        details: textInput,
        currency: 'SGD',
        amount: 25.00,
        rate: 1.0000,
        sgdAmount: 25.00
      }
      
      onExtractData(mockExtraction)
      setTextInput('')
      setIsProcessing(false)
      alert('AI提取完成，数据已添加到表单')
    }, 2000)
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-6">
      <h3 className="text-blue-600 text-lg font-semibold mb-4 flex items-center">
        🤖 AI Expense Assistant
      </h3>

      {/* 方法选择 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div 
          className={`bg-white border rounded-lg p-4 text-center cursor-pointer transition-colors ${
            selectedMethod === 'text' ? 'border-blue-500 bg-blue-100' : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => setSelectedMethod('text')}
        >
          <div className="text-2xl mb-2">💬</div>
          <div className="text-sm font-medium">Text Description</div>
        </div>
        
        <div 
          className={`bg-white border rounded-lg p-4 text-center cursor-pointer transition-colors ${
            selectedMethod === 'voice' ? 'border-blue-500 bg-blue-100' : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => setSelectedMethod('voice')}
        >
          <div className="text-2xl mb-2">🎤</div>
          <div className="text-sm font-medium">Voice Input</div>
        </div>
        
        <div 
          className={`bg-white border rounded-lg p-4 text-center cursor-pointer transition-colors ${
            selectedMethod === 'image' ? 'border-blue-500 bg-blue-100' : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => setSelectedMethod('image')}
        >
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm font-medium">Receipt Image</div>
        </div>
      </div>

      {/* 文本输入区域 */}
      {selectedMethod === 'text' && (
        <div className="bg-white border border-gray-300 rounded-md p-4">
          <textarea
            className="w-full min-h-[100px] p-2 border border-gray-300 rounded text-sm resize-vertical"
            placeholder="Describe your expense in natural language. For example: 'Taxi from office to client meeting at Marina Bay, cost $25 on November 15'"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <button 
            onClick={handleProcessText}
            disabled={isProcessing}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : 'Process with AI'}
          </button>
        </div>
      )}

      {/* 语音输入区域 */}
      {selectedMethod === 'voice' && (
        <div className="bg-white border border-gray-300 rounded-md p-4 text-center">
          <div className="text-gray-500 mb-4">语音输入功能开发中...</div>
          <button className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed">
            🎤 Click to Record
          </button>
        </div>
      )}

      {/* 图片上传区域 */}
      {selectedMethod === 'image' && (
        <div className="bg-white border border-gray-300 rounded-md p-4 text-center">
          <div className="text-gray-500 mb-4">图片识别功能开发中...</div>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8">
            <div className="text-2xl mb-2">📸</div>
            <p>Click to upload or drag & drop receipt image</p>
            <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (Max 10MB)</p>
          </div>
        </div>
      )}

      {/* 处理状态 */}
      {isProcessing && (
        <div className="text-center mt-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-blue-600">AI is processing your input...</p>
        </div>
      )}
    </div>
  )
}