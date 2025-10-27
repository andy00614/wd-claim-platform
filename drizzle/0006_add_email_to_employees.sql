-- Step 1: Add email column as nullable first (because table has existing data)
ALTER TABLE "employees" ADD COLUMN "email" varchar(100);--> statement-breakpoint

-- Step 2: Update existing employees with their email addresses
-- You need to update these based on your actual employee records in the database
-- Match by name or employee_code to set the correct email

UPDATE "employees" SET "email" = 'james@wild-dynasty.com' WHERE "name" = 'james' OR "name" ILIKE '%james%';--> statement-breakpoint
UPDATE "employees" SET "email" = 'eve@wild-dynasty.com' WHERE "name" = 'eve' OR "name" ILIKE '%eve%';--> statement-breakpoint
UPDATE "employees" SET "email" = 'andy@wild-dynasty.com' WHERE "name" = 'andy' OR "name" ILIKE '%andy%';--> statement-breakpoint
UPDATE "employees" SET "email" = 'zihui@wild-dynasty.com' WHERE "name" = 'zihui' OR "name" ILIKE '%zihui%';--> statement-breakpoint
UPDATE "employees" SET "email" = 'finance-sg@wild-dynasty.com' WHERE "name" = 'Candice' OR "name" ILIKE '%candice%' OR "name" ILIKE '%Tee Boh Chu%';--> statement-breakpoint
UPDATE "employees" SET "email" = 'celine@wild-dynasty.com' WHERE "name" = 'Celine' OR "name" ILIKE '%celine%' OR "name" ILIKE '%Chiong Moi Len%';--> statement-breakpoint

-- Step 3: After updating all records, make it NOT NULL and add unique constraint
ALTER TABLE "employees" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_email_unique" UNIQUE("email");
