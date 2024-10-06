import { Hono } from 'hono'
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { WardrobeItemSchema, type WardrobeItem } from '@/types';
import { db } from '@/db';
import { wardrobeItemsTable } from '@/schema';

const routes = new Hono()

routes.post('/', async (c) => {
    try {
        const requestData = await c.req.json();
        const wardrobeItem: WardrobeItem = WardrobeItemSchema.parse(requestData);

        const createdAt = new Date(); // Set current timestamp

        const response = await db.insert(wardrobeItemsTable).values({
            ...wardrobeItem,
            price: wardrobeItem.price ? wardrobeItem.price.toString() : undefined,
            purchaseDate: wardrobeItem.purchaseDate ? new Date(wardrobeItem.purchaseDate) : undefined,
            expiryDate: wardrobeItem.expiryDate ? new Date(wardrobeItem.expiryDate) : undefined,
            createdAt
        }).returning();
        return new Response(JSON.stringify({ data: response }), {
            status: 201,
        });
    } catch (error: any) {
        console.error("Error creating wardrobe item:", error);
        if (error instanceof z.ZodError) {
            return Response.json({ error: error.errors }, { status: 400 });
        }
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
})

routes.get('/:wardrobeId', async (c) => {
    const wardrobeId = parseInt(c.req.param('wardrobeId') || '0');
    if (!wardrobeId) {
        return new Response(JSON.stringify({ error: "Invalid wardrobeId" }), { status: 400 });
    }
    const wardrobeItems = await db.select().from(wardrobeItemsTable).where(eq(wardrobeItemsTable.wardrobeId, wardrobeId)).execute();
    return new Response(JSON.stringify({ data: wardrobeItems }));
})

export default routes
