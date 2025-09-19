// AI分析结果的数据结构，匹配ExpenseForm的formData结构
export interface ExpenseAnalysisResult {
  date?: string         // 格式: "MM/dd"
  itemNo?: string       // 如: "A1", "B2", "C2"等
  details?: string      // 详细说明
  currency?: string     // 货币代码如: "SGD"
  amount?: string       // 金额字符串格式，匹配formData.amount
  forexRate?: string    // 汇率字符串格式，匹配formData.forexRate
  sgdAmount?: string    // SGD金额字符串格式，匹配formData.sgdAmount
}

// API响应结构
export interface AnalysisApiResponse {
  success: boolean
  data?: ExpenseAnalysisResult
  error?: string
  details?: string
}