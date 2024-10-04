import { neon } from "@neondatabase/serverless";
import { z } from "zod";

// Define Zod schema for validation
const wardrobeItemSchema = z.object({
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

export async function POST(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`);
        const requestData = await request.json();

        // Validate request data against the schema
        const validatedData = wardrobeItemSchema.parse(requestData);

        const createdAt = new Date(); // Set current timestamp

        const response = await sql`
            INSERT INTO wardrobe_items (
                photo_uri,
                item_name,
                purchase_date,
                expiry_date,
                price,
                brand,
                category,
                color,
                size,
                wardrobe_id,
                user_id,
                state,
                created_at
            ) 
            VALUES (
                ${validatedData.photoUri},
                ${validatedData.itemName},
                ${validatedData.purchaseDate},
                ${validatedData.expiryDate},
                ${validatedData.price},
                ${validatedData.brand},
                ${validatedData.category},
                ${validatedData.color},
                ${validatedData.size},
                ${validatedData.wardrobeId},
                ${validatedData.userId},
                'newly_purchased',
                ${createdAt}
            )
            RETURNING id;`; // Return the ID of the newly created wardrobe item

        return new Response(JSON.stringify({ data: response }), {
            status: 201,
        });
    } catch (error) {
        console.error("Error creating wardrobe item:", error);
        if (error instanceof z.ZodError) {
            return Response.json({ error: error.errors }, { status: 400 });
        }
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
