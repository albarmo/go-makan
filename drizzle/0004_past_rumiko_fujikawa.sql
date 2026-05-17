ALTER TABLE "orders" ADD COLUMN "buyer_profile_id" integer;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "username" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "normalized_username" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "pin_hash" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "has_completed_setup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_profile_id_user_profiles_id_fk" FOREIGN KEY ("buyer_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_normalized_username_idx" ON "user_profiles" USING btree ("normalized_username");