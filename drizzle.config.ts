import { defineConfig } from 'drizzle-kit'

console.log('process.env.DATABASE_URL',process.env.DATABASE_URL_FOR_DRIZZLE)
export default defineConfig({
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    out: './drizzle',
    dbCredentials: {
        url: process.env.DATABASE_URL_FOR_DRIZZLE!,
    },
})