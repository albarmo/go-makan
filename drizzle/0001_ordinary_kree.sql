ALTER TABLE "orders" ADD COLUMN "payment_status" varchar(50) DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp;