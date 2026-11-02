import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { WardrobeItemSchema } from '@/types'
import { db } from '@/db'
import { wardrobeItems, wardrobes } from '@/schema'
import { requireUser, type AuthEnv } from '@/auth'
import { removeStoredPhoto } from '@/storage'

const routes = new Hono<AuthEnv>()

routes.use('*', requireUser)

const withUserId = <T extends { ownerUid: string }>(row: T) => ({
    ...row,
    userId: row.ownerUid,
})

async function ownsWardrobe(wardrobeId: number, uid: string) {
    const rows = await db
        .select({ id: wardrobes.id })
        .from(wardrobes)
        .where(
            and(
                eq(wardrobes.id, wardrobeId),
                eq(wardrobes.ownerUid, uid)
            )
        )
    return rows.length > 0
}

routes.post('/', async (c) => {
    try {
        const item = WardrobeItemSchema.parse(await c.req.json())
        const uid = c.get('uid')

        if (!(await ownsWardrobe(item.wardrobeId, uid))) {
            return Response.json(
                { error: 'Wardrobe not found' },
                { status: 404 }
            )
        }

        const [created] = await db
            .insert(wardrobeItems)
            .values({
                ownerUid: uid,
                wardrobeId: item.wardrobeId,
                itemName: item.itemName,
                photoUri: item.photoUri ?? '',
                purchaseDate: item.purchaseDate
                    ? new Date(item.purchaseDate)
                    : null,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                price: item.price ?? null,
                brand: item.brand ?? null,
                category: item.category ?? null,
                color: item.color ?? null,
                size: item.size ?? null,
                createdAt: new Date(),
            })
            .returning()

        return Response.json(
            { data: [withUserId(created)] },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Error creating wardrobe item:', error)

        if (error instanceof z.ZodError) {
            return Response.json({ error: error.errors }, { status: 400 })
        }

        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

// Every item belonging to the authenticated user, newest first.
routes.get('/', async (c) => {
    const items = await db
        .select()
        .from(wardrobeItems)
        .where(eq(wardrobeItems.ownerUid, c.get('uid')))
        .orderBy(desc(wardrobeItems.createdAt))

    return Response.json(
        { data: items.map(withUserId) },
        { status: 200 }
    )
})

routes.get('/:wardrobeId', async (c) => {
    const wardrobeId = parseInt(c.req.param('wardrobeId') || '0')
    if (!wardrobeId) {
        return Response.json({ error: 'Invalid wardrobeId' }, { status: 400 })
    }

    if (!(await ownsWardrobe(wardrobeId, c.get('uid')))) {
        return Response.json({ error: 'Wardrobe not found' }, { status: 404 })
    }

    const items = await db
        .select()
        .from(wardrobeItems)
        .where(eq(wardrobeItems.wardrobeId, wardrobeId))

    return Response.json(
        { data: items.map(withUserId) },
        { status: 200 }
    )
})

routes.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0')
        if (!id) {
            return Response.json({ error: 'Invalid item id' }, { status: 400 })
        }

        const rows = await db
            .select()
            .from(wardrobeItems)
            .where(
                and(
                    eq(wardrobeItems.id, id),
                    eq(wardrobeItems.ownerUid, c.get('uid'))
                )
            )

        if (rows.length === 0) {
            return Response.json({ error: 'Item not found' }, { status: 404 })
        }

        await db.delete(wardrobeItems).where(eq(wardrobeItems.id, id))
        await removeStoredPhoto(rows[0].photoUri)

        return new Response(null, { status: 204 })
    } catch (error: any) {
        console.error('Error deleting wardrobe item:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

export default routes
