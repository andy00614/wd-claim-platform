ALTER TABLE "attachments" ADD COLUMN "claim_id" integer;--> statement-breakpoint
ALTER TABLE "item_type" ADD COLUMN "remark" varchar(200);--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;