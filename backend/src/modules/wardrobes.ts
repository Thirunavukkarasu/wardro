import { sql } from "drizzle-orm";
import { Hono } from 'hono'
import { WardrobeSchema, type Wardrobe } from "@/types";
import { db } from "@/db";
import { wardrobesTable } from "@/schema";

const routes = new Hono()

routes.get('/', async (c) => {
    try {
        const requestData = await c.req.json();
        const wardrobe: Wardrobe = WardrobeSchema.parse(requestData);
        const createdAt = new Date();

        const response = await db.insert(wardrobesTable).values({
            ...wardrobe,
            createdAt
        });

        return new Response(JSON.stringify({ data: response }), {
            status: 201,
        });
    } catch (error) {
        console.error("Error creating wardrobe:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
})

routes.get('/', async (c) => {
    try {
        const userId = c.req.param('userId');
        const response = await db.select().from(wardrobesTable).where(sql`${wardrobesTable.userId} = ${userId}`);
        return new Response(JSON.stringify({ data: response }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error fetching wardrobes:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
})

export default routes