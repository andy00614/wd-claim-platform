'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// 定义费用数据的 Schema
const ExpenseSchema = z.object({
  // 日期信息
  date: z.string().describe('交易日期，格式 YYYY-MM-DD').optional(),
  
  // 费用类型 - 根据你的 itemTypes
  itemType: z.enum(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'])
    .describe('费用类型：C1-机票，C2-交通，C3-餐饮，C4-住宿，C5-通讯，C6-办公用品，C7-其他，C8-娱乐，C9-培训')
    .optional(),
  
  // 详细描述
  details: z.string().describe('费用详细描述，包含商家名称和消费内容').optional(),
  
  // 金额信息
  currency: z.string().describe('货币代码，如 SGD, USD, CNY').optional(),
  amount: z.number().describe('原始金额').optional(),
  
  // 商家信息
  merchant: z.string().describe('商家或服务提供商名称').optional(),
  
  // 额外信息
  receiptNumber: z.string().describe('收据或发票号码').optional(),
  paymentMethod: z.string().describe('支付方式').optional(),
})

export type ExtractedExpenseData = z.infer<typeof ExpenseSchema>

interface AnalyzeContent {
  type: 'image' | 'pdf'
  data: string  // base64 encoded string or data URL
}

export async function analyzeReceipt(content: AnalyzeContent): Promise<ExtractedExpenseData> {
  try {
    // 对于图片和PDF，OpenAI都使用image类型处理
    // PDF会被自动转换为图像进行分析
    const userContent = [
      {
        type: 'text' as const,
        text: content.type === 'pdf' 
          ? '请识别这个PDF文档中的费用信息，提取所有可见的关键信息。' 
          : '请识别这张图片中的费用信息，提取所有可见的关键信息。'
      },
      {
        type: 'image' as const,
        image: content.data  // data URL 格式，包含 data:image/... 或 data:application/pdf;base64,...
      }
    ]

    const { object } = await generateObject({
      model: openai('gpt-4o'),  // 使用 gpt-4o 以支持 PDF
      schema: ExpenseSchema,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的费用报销单据识别助手。请仔细分析图片或PDF中的收据、发票或其他费用凭证，提取相关信息。

费用类型对应关系：
- C1: 机票 (Flight)
- C2: 交通 (Transportation) - 出租车、地铁、公交等
- C3: 餐饮 (Meal)
- C4: 住宿 (Accommodation)
- C5: 通讯 (Communication)
- C6: 办公用品 (Office Supplies)
- C7: 其他 (Others)
- C8: 娱乐 (Entertainment)
- C9: 培训 (Training)

请根据单据内容自动判断最合适的费用类型。对于PDF文档，请分析其中包含的所有费用信息。`
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      temperature: 0.1,
      maxTokens: 1000,
    })

    return object
  } catch (error) {
    console.error('Error analyzing receipt:', error)
    throw new Error('Failed to analyze receipt')
  }
}