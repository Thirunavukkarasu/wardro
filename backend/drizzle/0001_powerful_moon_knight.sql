CREATE TABLE "profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_uid" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#4F46E5',
	"avatar_url" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wardrobe_item" ADD COLUMN "profile_id" integer;--> statement-breakpoint
ALTER TABLE "wardrobe" ADD COLUMN "profile_id" integer;--> statement-breakpoint
INSERT INTO "profile" ("owner_uid", "name", "color", "is_default")
SELECT
	"uid",
	coalesce(nullif("display_name", ''), split_part("email", '@', 1), 'My Wardrobe'),
	'#4F46E5',
	true
FROM "user";--> statement-breakpoint
UPDATE "wardrobe" w
SET "profile_id" = p."id"
FROM "profile" p
WHERE p."owner_uid" = w."owner_uid" AND p."is_default";--> statement-breakpoint
UPDATE "wardrobe_item" i
SET "profile_id" = w."profile_id"
FROM "wardrobe" w
WHERE w."id" = i."wardrobe_id";--> statement-breakpoint
UPDATE "wardrobe_item" i
SET "profile_id" = p."id"
FROM "profile" p
WHERE i."profile_id" IS NULL
	AND p."owner_uid" = i."owner_uid"
	AND p."is_default";--> statement-breakpoint
ALTER TABLE "wardrobe_item" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "wardrobe" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_owner_uid_user_uid_fk" FOREIGN KEY ("owner_uid") REFERENCES "public"."user"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_ownerUid_idx" ON "profile" USING btree ("owner_uid");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_default_owner_idx" ON "profile" USING btree ("owner_uid") WHERE "profile"."is_default";--> statement-breakpoint
ALTER TABLE "wardrobe_item" ADD CONSTRAINT "wardrobe_item_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wardrobe" ADD CONSTRAINT "wardrobe_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wardrobe_item_profileId_idx" ON "wardrobe_item" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "wardrobe_item_ownerProfile_idx" ON "wardrobe_item" USING btree ("owner_uid","profile_id");--> statement-breakpoint
CREATE INDEX "wardrobe_profileId_idx" ON "wardrobe" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "wardrobe_ownerProfile_idx" ON "wardrobe" USING btree ("owner_uid","profile_id");
