📚 概念解释：实时订阅 & Edge Functions

  🔄 实时订阅 (Realtime Subscriptions)

  简单理解：想象你在看股票价格，不需要刷新页面，价格自动更新
  // 举例：监听费用报销表的变化
  supabase
    .channel('expense-changes')
    .on('postgres_changes', {
      event: '*', // 任何变化（插入、更新、删除）
      schema: 'public',
      table: 'expense_claims'
    }, (payload) => {
      console.log('有新的报销单！', payload)
    })
    .subscribe()

  在你的项目中的应用：
  - 当有新报销单提交时，管理员界面实时显示
  - 报销状态变更时，用户立即收到反馈
  - 协同工作：多人同时编辑时看到彼此的更改

  ⚡ Edge Functions

  简单理解：在离用户最近的服务器上运行的小程序
  // 举例：AI处理收据的Function
  export default async function(req) {
    const { imageData } = await req.json()

    // 调用AI服务处理收据
    const result = await processReceiptWithAI(imageData)

    return new Response(JSON.stringify(result))
  }

  在你的项目中的应用：
  - AI文本处理：自然语言解析费用描述
  - OCR处理：识别收据图片内容
  - 邮件发送：报销审批通知
  - 定时任务：生成月度报表

  ---