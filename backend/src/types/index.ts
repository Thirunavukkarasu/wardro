import { z } from "zod";

/**
 * Human-readable name shared by users, profiles, wardrobes and items.
 * Mirrors `mobile-rn/lib/validation.ts` so the client and API agree.
 */
const label = (field: string, max = 50) =>
    z
        .string()
        .trim()
        .min(2, `${field} needs at least 2 characters`)
        .max(max, `${field} must be ${max} characters or fewer`)
        .regex(/\p{L}/u, `${field} must include at least one letter`);

export const UserSchema = z.object({
    name: label("Name"), // Name must be a non-empty string
    email: z.string().email("Email is required"), // Email must be valid
    clerkId: z.string().min(1, "Clerk ID is required"), // Clerk ID must be a non-empty string
});

export type User = z.infer<typeof UserSchema>;

export const WardrobeSchema = z.object({
    name: label("Wardrobe name"),
    description: z.string().max(500).optional(), // Description can be optional
});

export type Wardrobe = z.infer<typeof WardrobeSchema>;

export const WardrobeUpdateSchema = WardrobeSchema.partial();

export type WardrobeUpdate = z.infer<typeof WardrobeUpdateSchema>;

// Define Zod schema for validation
export const WardrobeItemSchema = z.object({
    photoUri: z.string().optional(),
    itemName: z.string().trim().min(1, "Item name is required").max(80, "Item name must be 80 characters or fewer"),
    purchaseDate: z.string().optional(), // You may want to use z.date() for actual Date objects
    expiryDate: z.string().optional(),
    price: z.number().optional(),
    brand: z.string().max(80).optional(),
    category: z.string().max(60).optional(),
    color: z.string().max(60).optional(),
    size: z.string().max(40).optional(),
    wardrobeId: z.number().int().positive("Wardrobe ID is required"),
});

export type WardrobeItem = z.infer<typeof WardrobeItemSchema>;

export const WardrobeItemUpdateSchema = z
    .object({
        photoUri: z.string().optional(),
        itemName: z.string().trim().min(1, 'Item name is required').max(80, "Item name must be 80 characters or fewer").optional(),
        purchaseDate: z.string().nullable().optional(),
        expiryDate: z.string().nullable().optional(),
        price: z.number().nullable().optional(),
        brand: z.string().max(80).nullable().optional(),
        category: z.string().max(60).nullable().optional(),
        color: z.string().max(60).nullable().optional(),
        size: z.string().max(40).nullable().optional(),
        wardrobeId: z.number().int().positive().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: 'No fields to update',
    });

export type WardrobeItemUpdate = z.infer<typeof WardrobeItemUpdateSchema>;

export const ProfileSchema = z.object({
    name: label("Profile name"),
    color: z.string().optional(),
    avatarUrl: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileUpdateSchema = ProfileSchema.partial();

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;