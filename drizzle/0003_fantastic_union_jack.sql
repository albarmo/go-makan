ALTER TABLE "order_items" ADD COLUMN "store_id" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "store_name_snapshot" varchar(255);--> statement-breakpoint
UPDATE "order_items" AS "oi"
SET
  "store_id" = "m"."store_id",
  "store_name_snapshot" = "s"."name"
FROM "menus" AS "m"
INNER JOIN "stores" AS "s" ON "s"."id" = "m"."store_id"
WHERE "oi"."menu_id" = "m"."id";--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "store_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "store_name_snapshot" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
