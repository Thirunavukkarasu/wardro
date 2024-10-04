import { z } from "zod";

export const UserSchema = z.object({
    name: z.string().min(1, "Name is required"), // Name must be a non-empty string
    email: z.string().email("Email is required"), // Email must be valid
    clerkId: z.string().min(1, "Clerk ID is required"), // Clerk ID must be a non-empty string
});

export type User = z.infer<typeof UserSchema>;

export const WardrobeSchema = z.object({
    userId: z.number().int().positive("User ID must be a positive integer"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(), // Description can be optional
});

export type Wardrobe = z.infer<typeof WardrobeSchema>;

// Define Zod schema for validation
export const WardrobeItemSchema = z.object({
    photoUri: z.string().optional(),
    itemName: z.string().min(1, "Item name is required"),
    purchaseDate: z.string().optional(), // You may want to use z.date() for actual Date objects
    expiryDate: z.string().optional(),
    price: z.number().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    color: z.string().optional(),
    size: z.string().optional(),
    wardrobeId: z.number().int().positive("Wardrobe ID is required"),
    userId: z.number().int().positive("User ID is required")
});

export type WardrobeItem = z.infer<typeof WardrobeItemSchema>;