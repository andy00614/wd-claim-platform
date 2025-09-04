CREATE TYPE "public"."claim_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_item_id" integer,
	"file_name" varchar NOT NULL,
	"url" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"file_size" numeric NOT NULL,
	"file_type" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"type" integer NOT NULL,
	"note" varchar,
	"evidence_no" varchar,
	"details" varchar,
	"currency_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"rate" numeric NOT NULL,
	"sgd_amount" numeric NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"employee_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"status" "claim_status" DEFAULT 'draft' NOT NULL,
	"total_amount" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"code" varchar(10) NOT NULL,
	CONSTRAINT "currency_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "item_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"no" varchar(10) NOT NULL,
	CONSTRAINT "item_type_no_unique" UNIQUE("no")
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_claim_item_id_claim_items_id_fk" FOREIGN KEY ("claim_item_id") REFERENCES "public"."claim_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_type_item_type_id_fk" FOREIGN KEY ("type") REFERENCES "public"."item_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;