import { relations } from "drizzle-orm/relations";
import { users, wardrobes, wardrobeItems } from "./schema";

export const wardrobesRelations = relations(wardrobes, ({one, many}) => ({
	user: one(users, {
		fields: [wardrobes.userId],
		references: [users.id]
	}),
	wardrobeItems_wardrobeId: many(wardrobeItems, {
		relationName: "wardrobeItems_wardrobeId_wardrobes_id"
	}),
	wardrobeItems_userId: many(wardrobeItems, {
		relationName: "wardrobeItems_userId_wardrobes_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	wardrobes: many(wardrobes),
}));

export const wardrobeItemsRelations = relations(wardrobeItems, ({one}) => ({
	wardrobe_wardrobeId: one(wardrobes, {
		fields: [wardrobeItems.wardrobeId],
		references: [wardrobes.id],
		relationName: "wardrobeItems_wardrobeId_wardrobes_id"
	}),
	wardrobe_userId: one(wardrobes, {
		fields: [wardrobeItems.userId],
		references: [wardrobes.id],
		relationName: "wardrobeItems_userId_wardrobes_id"
	}),
}));