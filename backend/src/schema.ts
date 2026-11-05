import { sql } from 'drizzle-orm'
import {
    boolean,
    doublePrecision,
    index,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    uniqueIndex,
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

/**
 * A profile is a person (or context) inside one account. Wardrobes and items
 * are always scoped to a profile; the Firebase uid remains the account owner.
 */
export const profiles = pgTable('profile', {
    id: serial('id').primaryKey(),
    ownerUid: text('owner_uid')
        .notNull()
        .references(() => users.uid, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').default('#4F46E5'),
    avatarUrl: text('avatar_url'),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => [
    index('profile_ownerUid_idx').on(table.ownerUid),
    uniqueIndex('profile_default_owner_idx')
        .on(table.ownerUid)
        .where(sql`${table.isDefault}`),
])

export const wardrobes = pgTable('wardrobe', {
    id: serial('id').primaryKey(),
    ownerUid: text('owner_uid')
        .notNull()
        .references(() => users.uid, { onDelete: 'cascade' }),
    profileId: integer('profile_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').default(''),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => [
    index('wardrobe_ownerUid_idx').on(table.ownerUid),
    index('wardrobe_profileId_idx').on(table.profileId),
    index('wardrobe_ownerProfile_idx').on(table.ownerUid, table.profileId),
])

export const wardrobeItems = pgTable('wardrobe_item', {
    id: serial('id').primaryKey(),
    ownerUid: text('owner_uid')
        .notNull()
        .references(() => users.uid, { onDelete: 'cascade' }),
    profileId: integer('profile_id')
        .notNull()
        .references(() => profiles.id, { onDelete: 'cascade' }),
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
}, (table) => [
    index('wardrobe_item_ownerUid_idx').on(table.ownerUid),
    index('wardrobe_item_profileId_idx').on(table.profileId),
    index('wardrobe_item_ownerProfile_idx').on(
        table.ownerUid,
        table.profileId
    ),
    index('wardrobe_item_wardrobeId_idx').on(table.wardrobeId),
])

export type InsertUser = typeof users.$inferInsert
export type SelectUser = typeof users.$inferSelect

export type InsertProfile = typeof profiles.$inferInsert
export type SelectProfile = typeof profiles.$inferSelect

export type InsertWardrobe = typeof wardrobes.$inferInsert
export type SelectWardrobe = typeof wardrobes.$inferSelect

export type InsertWardrobeItem = typeof wardrobeItems.$inferInsert
export type SelectWardrobeItem = typeof wardrobeItems.$inferSelect
