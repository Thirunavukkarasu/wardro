import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono'
import { z } from 'zod';

import { WardrobeItemSchema } from '@/types';
import { db } from '@/db';
import { wardrobeItemsTable, wardrobesTable } from '@/schema';
import { removeUploadedFile } from '@/modules/uploads';
import { requireUser, type AuthEnv } from '@/auth';

const routes = new Hono<AuthEnv>()

routes.use('*', requireUser)

/** True when the wardrobe exists and belongs to the authenticated user. */
async function ownsWardrobe(wardrobeId: number, userId: number) {
    const rows = await db
        .select({ id: wardrobesTable.id })
        .from(wardrobesTable)
        .where(
            and(
                eq(wardrobesTable.id, wardrobeId),
                eq(wardrobesTable.userId, userId)
            )
        );
    return rows.length > 0;
}

routes.post('/', async (c) => {
    try {
        const item = WardrobeItemSchema.parse(await c.req.json());
        const userId = c.get('userId');

        if (!(await ownsWardrobe(item.wardrobeId, userId))) {
            return Response.json(
                { error: "Wardrobe not found" },
                { status: 404 }
            );
        }

        const response = await db.insert(wardrobeItemsTable).values({
            ...item,
            userId,
            price: item.price ? item.price.toString() : undefined,
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
            createdAt: new Date(),
        }).returning();

        return Response.json({ data: response }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating wardrobe item:", error);
        if (error instanceof z.ZodError) {
            return Response.json({ error: error.errors }, { status: 400 });
        }
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
})

// Every item belonging to the authenticated user, newest first.
routes.get('/', async (c) => {
    const items = await db
        .select()
        .from(wardrobeItemsTable)
        .where(eq(wardrobeItemsTable.userId, c.get('userId')))
        .orderBy(desc(wardrobeItemsTable.createdAt));

    return Response.json({ data: items }, { status: 200 });
})

routes.get('/:wardrobeId', async (c) => {
    const wardrobeId = parseInt(c.req.param('wardrobeId') || '0');
    if (!wardrobeId) {
        return Response.json({ error: "Invalid wardrobeId" }, { status: 400 });
    }

    const userId = c.get('userId');
    if (!(await ownsWardrobe(wardrobeId, userId))) {
        return Response.json({ error: "Wardrobe not found" }, { status: 404 });
    }

    const items = await db
        .select()
        .from(wardrobeItemsTable)
        .where(eq(wardrobeItemsTable.wardrobeId, wardrobeId));

    return Response.json({ data: items }, { status: 200 });
})

routes.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0');
        if (!id) {
            return Response.json({ error: "Invalid item id" }, { status: 400 });
        }

        const userId = c.get('userId');
        const rows = await db
            .select({
                item: wardrobeItemsTable,
                ownerId: wardrobesTable.userId,
            })
            .from(wardrobeItemsTable)
            .innerJoin(
                wardrobesTable,
                eq(wardrobeItemsTable.wardrobeId, wardrobesTable.id)
            )
            .where(eq(wardrobeItemsTable.id, id));

        if (rows.length === 0 || rows[0].ownerId !== userId) {
            return Response.json({ error: "Item not found" }, { status: 404 });
        }

        await db.delete(wardrobeItemsTable).where(eq(wardrobeItemsTable.id, id));
        await removeUploadedFile(rows[0].item.photoUri);

        return new Response(null, { status: 204 });
    } catch (error: any) {
        console.error("Error deleting wardrobe item:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
})

export default routes
