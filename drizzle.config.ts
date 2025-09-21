import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL_FOR_DRIZZLE;

if (!databaseUrl) {
  throw new Error("DATABASE_URL_FOR_DRIZZLE is not defined");
}

console.log("process.env.DATABASE_URL", databaseUrl);
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
