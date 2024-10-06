import { pgTable, integer, serial, timestamp, varchar, numeric } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull(),
    // createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const wardrobesTable = pgTable("wardrobes", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => usersTable.id, { onDelete: 'cascade' }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }).default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertWardrobe = typeof wardrobesTable.$inferInsert;
export type SelectWardrobe = typeof wardrobesTable.$inferSelect;

export const wardrobeItemsTable = pgTable("wardrobe_items", {
    id: serial("id").primaryKey(),
    photoUri: varchar("photo_uri", { length: 255 }).default(""),
    itemName: varchar("item_name", { length: 255 }).notNull(),
    purchaseDate: timestamp("purchase_date"),
    expiryDate: timestamp("expiry_date"),
    price: numeric("price"),
    brand: varchar("brand", { length: 255 }),
    category: varchar("category", { length: 255 }),
    color: varchar("color", { length: 100 }),
    size: varchar("size", { length: 50 }),
    wardrobeId: integer("wardrobe_id").references(() => wardrobesTable.id, { onDelete: 'cascade' }).notNull(),
    userId: integer("user_id").references(() => wardrobesTable.id, { onDelete: 'cascade' }).notNull(),
    state: varchar("state", { length: 50 }).default('newly_purchased'),
    // usageState: varchar("usage_state", { length: 50 }).default('new'),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertWardrobeItem = typeof wardrobeItemsTable.$inferInsert;
export type SelectWardrobeItem = typeof wardrobeItemsTable.$inferSelect;
