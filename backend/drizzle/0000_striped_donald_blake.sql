CREATE TABLE "user" (
	"uid" text PRIMARY KEY NOT NULL,
	"email" text,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wardrobe_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_uid" text NOT NULL,
	"wardrobe_id" integer NOT NULL,
	"photo_uri" text DEFAULT '',
	"item_name" text NOT NULL,
	"purchase_date" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"price" double precision,
	"brand" text,
	"category" text,
	"color" text,
	"size" text,
	"state" text DEFAULT 'newly_purchased',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wardrobe" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_uid" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wardrobe_item" ADD CONSTRAINT "wardrobe_item_owner_uid_user_uid_fk" FOREIGN KEY ("owner_uid") REFERENCES "public"."user"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wardrobe_item" ADD CONSTRAINT "wardrobe_item_wardrobe_id_wardrobe_id_fk" FOREIGN KEY ("wardrobe_id") REFERENCES "public"."wardrobe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wardrobe" ADD CONSTRAINT "wardrobe_owner_uid_user_uid_fk" FOREIGN KEY ("owner_uid") REFERENCES "public"."user"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wardrobe_item_ownerUid_idx" ON "wardrobe_item" USING btree ("owner_uid");--> statement-breakpoint
CREATE INDEX "wardrobe_item_wardrobeId_idx" ON "wardrobe_item" USING btree ("wardrobe_id");--> statement-breakpoint
CREATE INDEX "wardrobe_ownerUid_idx" ON "wardrobe" USING btree ("owner_uid");