ALTER TABLE "wardrobe_items" DROP CONSTRAINT "wardrobe_items_user_id_wardrobes_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wardrobe_items" ADD CONSTRAINT "wardrobe_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
