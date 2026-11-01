import { pgTable, foreignKey, serial, integer, varchar, timestamp, numeric } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const wardrobes = pgTable("wardrobes", {
	id: serial("id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 255 }).default(''),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		wardrobesUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wardrobes_user_id_users_id_fk"
		}).onDelete("cascade"),
	}
});

export const wardrobeItems = pgTable("wardrobe_items", {
	id: serial("id").primaryKey().notNull(),
	photoUri: varchar("photo_uri", { length: 255 }).default(''),
	itemName: varchar("item_name", { length: 255 }).notNull(),
	purchaseDate: timestamp("purchase_date", { mode: 'string' }),
	expiryDate: timestamp("expiry_date", { mode: 'string' }),
	price: numeric("price"),
	brand: varchar("brand", { length: 255 }),
	category: varchar("category", { length: 255 }),
	color: varchar("color", { length: 100 }),
	size: varchar("size", { length: 50 }),
	wardrobeId: integer("wardrobe_id").notNull(),
	userId: integer("user_id").notNull(),
	state: varchar("state", { length: 50 }).default('newly_purchased'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		wardrobeItemsWardrobeIdWardrobesIdFk: foreignKey({
			columns: [table.wardrobeId],
			foreignColumns: [wardrobes.id],
			name: "wardrobe_items_wardrobe_id_wardrobes_id_fk"
		}).onDelete("cascade"),
		wardrobeItemsUserIdWardrobesIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [wardrobes.id],
			name: "wardrobe_items_user_id_wardrobes_id_fk"
		}).onDelete("cascade"),
	}
});

export const users = pgTable("users", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	clerkId: varchar("clerk_id", { length: 255 }).notNull(),
});