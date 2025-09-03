# Wild Dynasty 智能费用报销系统 - 开发任务清单

## 📋 项目概述
构建一个基于Next.js的现代化费用报销系统，集成AI智能助手功能，支持多种费用录入方式。

## 🛠 技术栈
- **前端框架**: Next.js 14 (App Router)
- **数据库**: Supabase (PostgreSQL + Auth + Storage)
- **ORM**: Drizzle ORM
- **API框架**: Hono (部署到Fly.io)
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **表单**: React Hook Form + Zod
- **部署**: Vercel (前端) + Fly.io (API)

## 🎯 开发原则
1. **渐进式开发**：从核心功能开始，逐步添加高级特性
2. **组件化设计**：每个功能模块独立开发和测试
3. **类型安全**：充分利用TypeScript和Drizzle的类型系统
4. **代码质量**：遵循React最佳实践，保持代码整洁

---

## 第一阶段：Supabase + 认证系统设置

### 1.1 Supabase项目配置
- [ ] 创建Supabase项目
- [ ] 获取项目URL和API密钥
- [ ] 配置环境变量（.env.local）
  ```env
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [ ] 安装Supabase客户端库
  ```bash
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  ```

### 1.2 Supabase Auth配置
- [ ] 启用Google OAuth provider
- [ ] 配置OAuth回调URL
- [ ] 创建Supabase客户端工具函数
- [ ] 设置Auth Helpers for Next.js

### 1.3 认证UI实现
- [ ] 创建登录页面（使用Supabase Auth UI）
- [ ] 实现Google SSO登录按钮
- [ ] 创建认证上下文（AuthContext）
- [ ] 实现用户会话管理
- [ ] 添加路由保护middleware

### 1.4 员工档案系统
- [ ] 设计员工表结构（profiles表）
- [ ] 创建员工绑定页面
- [ ] 实现员工选择和绑定逻辑
- [ ] 存储用户-员工关联
- [ ] 创建用户信息显示组件

---

## 第三阶段：核心表单功能

### 3.1 数据模型设计
- [ ] 定义TypeScript接口
  - [ ] Employee（员工）
  - [ ] ExpenseClaim（报销单）
  - [ ] ExpenseItem（费用项）
  - [ ] Attachment（附件）

### 3.2 费用表单开发
- [ ] 创建表单布局组件
- [ ] 实现日期选择器
- [ ] 创建费用类别选择器（带GL账户映射）
- [ ] 实现多币种支持
  - [ ] 币种选择
  - [ ] 汇率计算
  - [ ] SGD自动转换

### 3.3 费用项管理
- [ ] 添加费用项功能
- [ ] 编辑费用项功能
- [ ] 删除费用项功能
- [ ] 费用列表展示组件
- [ ] 总额实时计算

### 3.4 表单验证
- [ ] 使用react-hook-form或Formik
- [ ] 实现字段验证规则
- [ ] 错误消息显示
- [ ] 表单提交前验证

---

## 第四阶段：AI助手集成

### 4.1 AI界面组件
- [ ] 创建AI助手容器组件
- [ ] 实现三种输入方式切换UI
- [ ] 添加处理状态指示器
- [ ] 创建结果预览组件

### 4.2 文本输入处理
- [ ] 创建文本输入组件
- [ ] 集成AI API（OpenAI/自建）
- [ ] 实现文本解析逻辑
- [ ] 数据提取和映射到表单

### 4.3 语音输入功能
- [ ] 实现Web Speech API集成
- [ ] 创建录音按钮和状态显示
- [ ] 语音转文字功能
- [ ] 转录文本的AI处理

### 4.4 图像识别（OCR）
- [ ] 实现图片上传组件
- [ ] 集成OCR服务（Google Vision/Tesseract）
- [ ] 图片预览功能
- [ ] 收据信息提取和解析

### 4.5 AI建议系统
- [ ] 创建建议显示组件
- [ ] 实现智能提示逻辑
- [ ] 历史数据关联建议

---

## 第五阶段：文件管理系统

### 5.1 文件上传功能
- [ ] 创建拖拽上传组件
- [ ] 文件类型和大小验证
- [ ] 多文件批量上传
- [ ] 上传进度显示

### 5.2 文件存储
- [ ] 选择存储方案（本地/云存储）
- [ ] 实现文件上传API
- [ ] 文件元数据管理
- [ ] 生成文件预览

### 5.3 文件管理界面
- [ ] 文件列表显示
- [ ] 文件预览功能
- [ ] 文件删除功能
- [ ] 文件下载功能

---

## 第六阶段：Drizzle ORM + 数据持久化

### 6.1 Drizzle ORM设置
- [ ] 安装Drizzle ORM相关依赖
  ```bash
  npm install drizzle-orm drizzle-kit postgres
  npm install -D @types/pg
  ```
- [ ] 配置drizzle.config.ts
- [ ] 设置Supabase连接配置
- [ ] 创建数据库schema文件

### 6.2 数据库Schema设计
- [ ] 创建employees表（员工信息）
- [ ] 创建expense_claims表（报销单）
- [ ] 创建expense_items表（费用项目）
- [ ] 创建attachments表（附件）
- [ ] 设置表关系和约束
- [ ] 运行数据库迁移

### 6.3 Hono API开发
- [ ] 创建Hono应用基础结构
- [ ] 实现报销单CRUD API
- [ ] 实现费用项API
- [ ] 附件上传API（Supabase Storage）
- [ ] 用户和员工数据API
- [ ] API路由组织和中间件

### 6.4 状态管理（Zustand）
- [ ] 安装Zustand
- [ ] 创建用户状态store
- [ ] 创建报销单状态store
- [ ] 实现乐观更新
- [ ] 本地数据缓存策略

---

## 第七阶段：报销历史与报表

### 7.1 历史记录页面
- [ ] 创建报销列表组件
- [ ] 实现分页功能
- [ ] 添加筛选和排序
- [ ] 状态标签显示

### 7.2 报销单详情
- [ ] 详情页面布局
- [ ] 只读模式显示
- [ ] 编辑模式切换
- [ ] 状态更新功能

### 7.3 数据导出
- [ ] CSV生成功能
- [ ] 导出格式配置
- [ ] 批量导出功能
- [ ] 导出历史记录

---

## 第八阶段：高级功能

### 8.1 审批工作流
- [ ] 设计审批流程
- [ ] 创建审批界面
- [ ] 实现审批逻辑
- [ ] 审批历史记录

### 8.2 通知系统
- [ ] Email通知集成
- [ ] 应用内通知
- [ ] 推送通知（PWA）

### 8.3 报表与分析
- [ ] 费用统计仪表板
- [ ] 图表可视化（Chart.js/Recharts）
- [ ] 导出PDF报表
- [ ] 费用趋势分析

---

## 第九阶段：架构优化 & Monorepo

### 9.1 Monorepo迁移
- [ ] 选择monorepo工具（pnpm workspaces / Turborepo）
- [ ] 重构项目结构
  ```
  apps/
    ├── web/          (Next.js前端)
    └── api/          (Hono API)
  packages/
    ├── ui/           (共享UI组件)
    ├── database/     (Drizzle schemas)
    ├── types/        (共享类型定义)
    └── utils/        (共享工具函数)
  ```
- [ ] 配置workspace依赖管理
- [ ] 设置共享build配置
- [ ] 更新部署配置

### 9.2 前端优化
- [ ] 代码分割（Code Splitting）
- [ ] 懒加载实现
- [ ] 图片优化（Next.js Image）
- [ ] 缓存策略优化

### 9.3 后端优化（Hono API）
- [ ] API响应优化
- [ ] 数据库查询优化（Drizzle）
- [ ] 实现API缓存层
- [ ] 添加请求限流

### 9.4 用户体验优化
- [ ] 添加加载骨架屏
- [ ] 优化表单交互
- [ ] 键盘快捷键
- [ ] 无障碍支持（a11y）

---

## 第十阶段：测试与部署

### 10.1 测试
- [ ] 单元测试（Jest）
- [ ] 组件测试（React Testing Library）
- [ ] 集成测试
- [ ] E2E测试（Playwright/Cypress）

### 10.2 文档
- [ ] API文档
- [ ] 组件文档（Storybook）
- [ ] 用户使用手册
- [ ] 部署文档

### 10.3 部署配置
- [ ] 前端部署到Vercel
  - [ ] 连接GitHub仓库
  - [ ] 配置环境变量
  - [ ] 设置构建配置
- [ ] API部署到Fly.io
  - [ ] 创建Dockerfile
  - [ ] 配置fly.toml
  - [ ] 设置环境变量和secrets
- [ ] 配置CORS和域名
- [ ] 设置监控和日志
- [ ] 配置CI/CD管道

---

## 🎓 学习要点（每个阶段）

### 技术栈学习路径
1. **基础**：React Hooks, Next.js 14 App Router
2. **数据库**：PostgreSQL基础 → Supabase → Drizzle ORM
3. **状态管理**：useState → Context API → Zustand
4. **表单处理**：受控组件 → React Hook Form + Zod
5. **样式**：CSS → Tailwind CSS → shadcn/ui
6. **认证**：Supabase Auth → 用户管理
7. **API开发**：Next.js API Routes → Hono
8. **部署**：Vercel → 多环境部署 → Fly.io
9. **测试**：Jest基础 → React Testing Library

### 每个步骤的学习模式
1. **概念理解**：先理解为什么需要这个功能
2. **技术选型**：了解不同方案的优缺点
3. **实践编码**：动手实现基础版本
4. **优化改进**：根据反馈迭代优化
5. **总结复盘**：记录遇到的问题和解决方案

---

## 📝 注意事项

1. **版本控制**：每完成一个小功能就提交Git
2. **代码审查**：定期回顾代码质量
3. **用户反馈**：每个阶段完成后进行用户测试
4. **文档更新**：同步更新技术文档
5. **安全考虑**：处理敏感数据时注意安全性

---

## 🚀 开始开发

建议按照以下顺序进行：
1. 先完成第一、二阶段，建立项目基础
2. 实现第三阶段的核心表单功能
3. 根据需求优先级选择第四阶段（AI）或第六阶段（数据持久化）
4. 逐步完善其他功能模块

每个阶段预计时间：
- 简单功能：2-3天
- 中等复杂度：1周
- 复杂功能：2周

记住：**小步快跑，持续迭代！**