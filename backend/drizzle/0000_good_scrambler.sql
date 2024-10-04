CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wardrobe_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"photo_uri" varchar(255) DEFAULT '',
	"item_name" varchar(255) NOT NULL,
	"purchase_date" timestamp,
	"expiry_date" timestamp,
	"price" numeric,
	"brand" varchar(255),
	"category" varchar(255),
	"color" varchar(100),
	"size" varchar(50),
	"wardrobe_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"state" varchar(50) DEFAULT 'newly_purchased',
	"usage_state" varchar(50) DEFAULT 'new',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wardrobes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255) DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wardrobe_items" ADD CONSTRAINT "wardrobe_items_wardrobe_id_wardrobes_id_fk" FOREIGN KEY ("wardrobe_id") REFERENCES "public"."wardrobes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wardrobe_items" ADD CONSTRAINT "wardrobe_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wardrobes" ADD CONSTRAINT "wardrobes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
