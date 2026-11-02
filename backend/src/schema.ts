import {
    doublePrecision,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'

/**
 * Portable Postgres schema.
 *
 * Table and column names match the current Cloud SQL database. Nothing here is
 * provider-specific: point `DATABASE_URL` at any Postgres and the same schema
 * and queries apply.
 */

export const users = pgTable('user', {
    uid: text('uid').primaryKey(),
    email: text('email'),
    displayName: text('display_name'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
})

export const wardrobes = pgTable('wardrobe', {
    id: serial('id').primaryKey(),
    ownerUid: text('owner_uid')
        .notNull()
        .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').default(''),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
})

export const wardrobeItems = pgTable('wardrobe_item', {
    id: serial('id').primaryKey(),
    ownerUid: text('owner_uid')
        .notNull()
        .references(() => users.uid, { onDelete: 'cascade' }),
    wardrobeId: integer('wardrobe_id')
        .notNull()
        .references(() => wardrobes.id, { onDelete: 'cascade' }),
    photoUri: text('photo_uri').default(''),
    itemName: text('item_name').notNull(),
    purchaseDate: timestamp('purchase_date', { withTimezone: true }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    price: doublePrecision('price'),
    brand: text('brand'),
    category: text('category'),
    color: text('color'),
    size: text('size'),
    state: text('state').default('newly_purchased'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
})

export type InsertUser = typeof users.$inferInsert
export type SelectUser = typeof users.$inferSelect

export type InsertWardrobe = typeof wardrobes.$inferInsert
export type SelectWardrobe = typeof wardrobes.$inferSelect

export type InsertWardrobeItem = typeof wardrobeItems.$inferInsert
export type SelectWardrobeItem = typeof wardrobeItems.$inferSelect
