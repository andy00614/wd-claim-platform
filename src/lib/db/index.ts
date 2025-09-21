import { drizzle } from "drizzle-orm/node-postgres";
import { getRequiredEnvVar } from "@/utils/environments";
import * as schema from "./schema";

// 创建数据库连接
const databaseUrl = getRequiredEnvVar("DATABASE_URL");

export const db = drizzle({
  connection: databaseUrl,
  schema,
});

export type DB = typeof db;
