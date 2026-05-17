ALTER TABLE "order_items" ADD COLUMN "fulfillment_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "fulfilled_at" timestamp;