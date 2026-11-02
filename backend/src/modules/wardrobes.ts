import { eq, sql } from "drizzle-orm";
import { Hono } from 'hono'
import { WardrobeSchema, type Wardrobe } from "@/types";
import { db } from "@/db";
import { wardrobesTable, wardrobeItemsTable } from "@/schema";
import { removeUploadedFile } from "@/modules/uploads";

const routes = new Hono()

routes.post('/', async (c) => {
    try {
        const requestData = await c.req.json();
        console.log("Request data:", requestData);
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

// Must stay above the `/:userId` route so `/4/summary` is not parsed as a
// wardrobe id.
routes.get('/:userId/summary', async (c) => {
    try {
        const userId = parseInt(c.req.param('userId') || '0');
        if (!userId) {
            return Response.json({ error: "User ID is required" }, { status: 400 });
        }

        const response = await db
            .select({
                id: wardrobesTable.id,
                userId: wardrobesTable.userId,
                name: wardrobesTable.name,
                description: wardrobesTable.description,
                createdAt: wardrobesTable.createdAt,
                itemCount: sql<number>`count(${wardrobeItemsTable.id})`.mapWith(Number),
                coverPhotoUri: sql<string | null>`max(nullif(${wardrobeItemsTable.photoUri}, ''))`,
            })
            .from(wardrobesTable)
            .leftJoin(
                wardrobeItemsTable,
                eq(wardrobeItemsTable.wardrobeId, wardrobesTable.id)
            )
            .where(eq(wardrobesTable.userId, userId))
            .groupBy(wardrobesTable.id)
            .orderBy(wardrobesTable.createdAt);

        return new Response(JSON.stringify({ data: response }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error fetching wardrobe summary:", error);
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

routes.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0');
        if (!id) {
            return Response.json({ error: "Invalid wardrobe id" }, { status: 400 });
        }

        // Read the children first so their uploaded files can be cleaned up
        // after the cascade removes the rows.
        const items = await db
            .select()
            .from(wardrobeItemsTable)
            .where(eq(wardrobeItemsTable.wardrobeId, id));

        const deleted = await db
            .delete(wardrobesTable)
            .where(eq(wardrobesTable.id, id))
            .returning();

        if (deleted.length === 0) {
            return Response.json({ error: "Wardrobe not found" }, { status: 404 });
        }

        await Promise.all(items.map((item) => removeUploadedFile(item.photoUri)));
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting wardrobe:", error);
        const errorMessage = (error as any).message;
        return Response.json({ error: errorMessage }, { status: 500 });
    }
})

export default routes