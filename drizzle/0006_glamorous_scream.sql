ALTER TABLE "claims" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "email" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "item_type" ADD COLUMN "xero_code" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "item_type" ADD CONSTRAINT "item_type_xero_code_unique" UNIQUE("xero_code");