-- Step 1: Add the column as nullable first
ALTER TABLE "item_type" ADD COLUMN "item_no" varchar(10);--> statement-breakpoint

-- Step 2: Update existing records with item_no based on their position
-- You need to manually update these values based on your data
-- Example: UPDATE item_type SET item_no = 'A1' WHERE id = 1;

-- Step 3: After manually updating all records, make it NOT NULL and add unique constraint
-- ALTER TABLE "item_type" ALTER COLUMN "item_no" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "item_type" ADD CONSTRAINT "item_type_item_no_unique" UNIQUE("item_no");