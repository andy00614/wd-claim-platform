import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// 使用环境变量中的数据库连接字符串
const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, { schema })