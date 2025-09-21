import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getRequiredEnvVar } from "@/utils/environments";
import * as schema from "./schema";

// 使用环境变量中的数据库连接字符串
const databaseUrl = getRequiredEnvVar("DATABASE_URL");
const client = postgres(databaseUrl);

export const db = drizzle(client, { schema });
