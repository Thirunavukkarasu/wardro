import { and, eq, sql } from "drizzle-orm";
import { Hono } from 'hono'
import { WardrobeSchema } from "@/types";
import { db } from "@/db";
import { wardrobesTable, wardrobeItemsTable } from "@/schema";
import { removeUploadedFile } from "@/modules/uploads";
import { requireUser, type AuthEnv } from "@/auth";

const routes = new Hono<AuthEnv>()

// Every route below acts on the user named by the verified Firebase token.
routes.use('*', requireUser)

routes.post('/', async (c) => {
    try {
        const requestData = await c.req.json();
        const wardrobe = WardrobeSchema.parse(requestData);

        const response = await db.insert(wardrobesTable).values({
            name: wardrobe.name,
            description: wardrobe.description ?? '',
            userId: c.get('userId'),
            createdAt: new Date(),
        }).returning();

        return Response.json({ data: response }, { status: 201 });
    } catch (error) {
        console.error("Error creating wardrobe:", error);
        const errorMessage = (error as any).message;
        return Response.json({ error: errorMessage }, { status: 500 });
    }
})

routes.get('/summary', async (c) => {
    try {
        const userId = c.get('userId');

        const response = await db
            .select({
                id: wardrobesTable.id,
                userId: wardrobesTable.userId,
                name: wardrobesTable.name,
                description: wardrobesTable.description,
                createdAt: wardrobesTable.createdAt,
                itemCount: sql<number>`count(${wardrobeItemsTable.id})`.mapWith(Number),
                totalValue: sql<number>`coalesce(sum(${wardrobeItemsTable.price}), 0)`.mapWith(Number),
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

        return Response.json({ data: response }, { status: 200 });
    } catch (error) {
        console.error("Error fetching wardrobe summary:", error);
        const errorMessage = (error as any).message;
        return Response.json({ error: errorMessage }, { status: 500 });
    }
})

routes.get('/', async (c) => {
    try {
        const response = await db
            .select()
            .from(wardrobesTable)
            .where(eq(wardrobesTable.userId, c.get('userId')));

        return Response.json({ data: response }, { status: 200 });
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

        const userId = c.get('userId');
        const owned = await db
            .select({ id: wardrobesTable.id })
            .from(wardrobesTable)
            .where(and(eq(wardrobesTable.id, id), eq(wardrobesTable.userId, userId)));

        if (owned.length === 0) {
            return Response.json({ error: "Wardrobe not found" }, { status: 404 });
        }

        // Read the children first so their uploaded files can be cleaned up
        // after the cascade removes the rows.
        const items = await db
            .select()
            .from(wardrobeItemsTable)
            .where(eq(wardrobeItemsTable.wardrobeId, id));

        await db.delete(wardrobesTable).where(eq(wardrobesTable.id, id));
        await Promise.all(items.map((item) => removeUploadedFile(item.photoUri)));

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting wardrobe:", error);
        const errorMessage = (error as any).message;
        return Response.json({ error: errorMessage }, { status: 500 });
    }
})

export default routes
