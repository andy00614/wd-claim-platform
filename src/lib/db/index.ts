import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// 创建数据库连接
export const db = drizzle({
  connection: process.env.DATABASE_URL!,
  schema,
});

export type DB = typeof db;