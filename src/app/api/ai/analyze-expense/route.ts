import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

// 创建OpenAI客户端
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 定义返回的数据结构，匹配ExpenseForm的formData结构
const ExpenseAnalysisSchema = z.object({
  date: z.string().optional().describe('Date in MM/dd/yyyy format from the expense document. If year is not visible, use MM/dd format.'),
  itemNo: z.string().optional().describe('Expense category code like A1, A2, B1, C1, C2, etc.'),
  details: z.string().optional().describe('Expense description including vendor/restaurant name'),
  currency: z.string().optional().describe('Currency code like SGD, USD, EUR, etc.'),
  amount: z.string().optional().describe('Expense amount as string'),
  forexRate: z.string().optional().describe('Exchange rate as string, calculated from exchange rates'),
  sgdAmount: z.string().optional().describe('SGD amount as string, calculated from amount and rate'),
})

export async function POST(request: NextRequest) {
  try {
    // 验证环境变量
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // 确保图片数据格式正确
    let imageData: string
    if (image.startsWith('data:')) {
      // 如果已经是完整的data URL，直接使用
      imageData = image
    } else {
      // 如果只是base64数据，添加data URL前缀
      imageData = `data:image/jpeg;base64,${image}`
    }

    console.log('Processing image data, type:', imageData.substring(0, 50) + '...')
    console.log('File type detected:', imageData.split(':')[1]?.split(';')[0])

    // 使用 AI SDK 的 generateObject 进行多模态分析
    const result = await generateObject({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze this expense receipt/invoice image and extract the following information:

              - date: Date in MM/dd/yyyy format if year is visible (e.g., "12/25/2024"), otherwise MM/dd format (e.g., "12/25")
              - itemNo: Expense category code based on content:
                * A1 = Entertainment
                * A2 = IT Services
                * A3 = Medical
                * B1 = Office
                * B2 = Printing
                * B3 = Courier
                * C1 = Telephone
                * C2 = Transportation
                * C3 = Travel Intl
                * C4 = Training
              - details: Detailed description including vendor/restaurant name and purpose
              - currency: Currency code (SGD, USD, EUR, etc.)
              - amount: Total expense amount as number

              Important guidelines:
              - Only extract information that is clearly visible in the image
              - If something is not clear or missing, omit that field
              - For itemNo, make your best guess based on the expense type
              - For details, include vendor name and brief description
              - Ensure all amounts are numbers, not strings
              - Do not calculate exchange rates - they will be calculated automatically`,
            },
            {
              type: 'image',
              image: imageData,
            },
          ],
        },
      ],
      schema: ExpenseAnalysisSchema,
      maxRetries: 2,
    })

    const analysisResult = result.object

    console.log('AI analysis successful:', JSON.stringify(analysisResult, null, 2))
    console.log('Raw AI response text:', result.response.headers)
    console.log('Usage:', result.usage)

    return NextResponse.json({
      success: true,
      data: analysisResult
    })

  } catch (error) {
    console.error('AI analysis error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // 处理不同类型的错误
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'AI service is currently busy. Please try again in a moment.' },
          { status: 429 }
        )
      }

      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please contact support.' },
          { status: 500 }
        )
      }

      if (error.message.includes('image')) {
        return NextResponse.json(
          { error: 'Image format not supported or corrupted. Please try with a clear image.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again or fill in the form manually.' },
      { status: 500 }
    )
  }
}