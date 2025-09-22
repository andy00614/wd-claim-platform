'use client'

import { useState } from 'react'
import PdfPreview from '@/components/ui/pdf-preview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestPdfPage() {
  const [showTest, setShowTest] = useState(false)

  // 使用一个公开的PDF文件用于测试
  const testPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>PDF Preview 功能测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">测试PDF预览功能</h3>
              <p className="text-gray-600 mb-4">
                点击下面的按钮来测试PDF转图片预览功能。这将使用一个示例PDF文件。
              </p>

              <Button
                onClick={() => setShowTest(!showTest)}
                className="mb-4"
              >
                {showTest ? '隐藏测试' : '开始测试PDF预览'}
              </Button>

              {showTest && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <h4 className="font-medium mb-4">PDF预览组件测试</h4>
                  <div className="max-w-md">
                    <PdfPreview
                      url={testPdfUrl}
                      fileName="test-document.pdf"
                      maxPages={2}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">功能说明</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>PDF文件会在客户端转换为图片预览</li>
                <li>支持显示多页PDF（可配置页数）</li>
                <li>使用PDF.js纯JavaScript实现，无需外部服务</li>
                <li>提供加载状态和错误处理</li>
                <li>可以点击"Open PDF"查看原文件</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}