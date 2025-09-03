## Rules
- 每次使用第三方库时候都要调取mcp(context7)查询最新的文档
- nextjs 优先使用 server-components 的设计模式
- 我的包管理是用 bun 的
- 代码切勿过度设计，用最简单最易读的设计模式为好
- 对就是对，不对就是不对，不要勉强的鼓励我


## 技术栈
1. 数据库：Supabase（PostgreSQL + 实时功能 + 认证）
2. ORM：Drizzle ORM（类型安全，性能好）
3. API：Next.js + Hono（轻量级，高性能）
4. 部署：API部署到Fly.io
5. 架构：最终会是monorepo