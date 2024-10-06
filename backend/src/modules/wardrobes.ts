import { eq, sql } from "drizzle-orm";
import { Hono } from 'hono'
import { WardrobeSchema, type Wardrobe } from "@/types";
import { db } from "@/db";
import { wardrobesTable } from "@/schema";

const routes = new Hono()

routes.post('/', async (c) => {
    try {
        const requestData = await c.req.json();
        const wardrobe: Wardrobe = WardrobeSchema.parse(requestData);
        const createdAt = new Date();

        const response = await db.insert(wardrobesTable).values({
            ...wardrobe,
            createdAt
        }).returning();

        return new Response(JSON.stringify({ data: response }), {
            status: 201,
        });
    } catch (error) {
        console.error("Error creating wardrobe:", error);
        const errorMessage = (error as any).message;
        return Response.json({ error: errorMessage }, { status: 500 });
    }
})

routes.get('/:userId', async (c) => {
    try {
        const userId = parseInt(c.req.param('userId') || '0');
        if (!userId) {
            return Response.json({ error: "User ID is required" }, { status: 400 });
        }
        const response = await db.select().from(wardrobesTable).where(eq(wardrobesTable.userId, userId));
        return new Response(JSON.stringify({ data: response }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error fetching wardrobes:", error);
        const errorMessage = (error as any).message;
        return Response.json({ error: errorMessage }, { status: 500 });
    }
})

export default routes