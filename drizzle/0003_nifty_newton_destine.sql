CREATE TYPE "public"."employee_role" AS ENUM('employee', 'admin');--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "role" "employee_role" DEFAULT 'employee' NOT NULL;