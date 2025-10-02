## Project: Analytics Dashboard

This is a Next.js dashboard for visualizing user analytic:

### Architecture Decisions
- Server Components by default, Client Components only when necessary
- tRPC for type-safe API calls
- Prisma for database access with explicit select statements
- Tailwind for styling (no custom CSS files)

### Code Style
- Formatting: Prettier with 100-char lines
- Imports: sorted with simple-import-sort
- Components: Pascal case, co-located with their tests
- Hooks: always prefix with 'use'

### Patterns to Follow
- Data fetching happens in Server Components
- Client Components receive data as props
- Use Zod schemas for all external data
- Error boundaries around every data display component

### What NOT to Do
- Don't use useEffect for data fetching
- Don't create global state without explicit approval
- Don't bypass TypeScript with 'any' types


## Rules
- 一定注意：每次使用第三方库时候都要调取mcp(context7)查询最新的文档!!!
- nextjs 优先使用 server-components 的设计模式
- 我的包管理是用 bun 的
- 代码切勿过度设计，用最简单最易读的设计模式为好
- 对就是对，不对就是不对，不要勉强的鼓励我
- 每个组件最好少于 100 行左右，如果超过 100 行，要拆分成多个组件

## 技术栈
1. 数据库：Supabase（PostgreSQL + 实时功能 + 认证）
2. ORM：Drizzle ORM（类型安全，性能好）
3. API：Next.js + Hono（轻量级，高性能）
4. 部署：API部署到Fly.io
5. 架构：最终会是monorepo
