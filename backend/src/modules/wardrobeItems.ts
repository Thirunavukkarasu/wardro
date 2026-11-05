import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import {
    WardrobeItemSchema,
    WardrobeItemUpdateSchema,
} from '@/types'
import { db } from '@/db'
import { wardrobeItems, wardrobes } from '@/schema'
import { requireUser } from '@/auth'
import { requireProfile, type ProfileEnv } from '@/profile'
import { removeStoredPhoto } from '@/storage'

const routes = new Hono<ProfileEnv>()

routes.use('*', requireUser, requireProfile)

const withUserId = <T extends { ownerUid: string }>(row: T) => ({
    ...row,
    userId: row.ownerUid,
})

async function ownsWardrobe(
    wardrobeId: number,
    uid: string,
    profileId: number
) {
    const rows = await db
        .select({ id: wardrobes.id })
        .from(wardrobes)
        .where(
            and(
                eq(wardrobes.id, wardrobeId),
                eq(wardrobes.ownerUid, uid),
                eq(wardrobes.profileId, profileId)
            )
        )
    return rows.length > 0
}

routes.post('/', async (c) => {
    try {
        const item = WardrobeItemSchema.parse(await c.req.json())
        const uid = c.get('uid')

        if (!(await ownsWardrobe(item.wardrobeId, uid, c.get('profileId')))) {
            return Response.json(
                { error: 'Wardrobe not found' },
                { status: 404 }
            )
        }

        const [created] = await db
            .insert(wardrobeItems)
            .values({
                ownerUid: uid,
                profileId: c.get('profileId'),
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
        .where(
            and(
                eq(wardrobeItems.ownerUid, c.get('uid')),
                eq(wardrobeItems.profileId, c.get('profileId'))
            )
        )
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

    if (
        !(await ownsWardrobe(
            wardrobeId,
            c.get('uid'),
            c.get('profileId')
        ))
    ) {
        return Response.json({ error: 'Wardrobe not found' }, { status: 404 })
    }

    const items = await db
        .select()
        .from(wardrobeItems)
        .where(
            and(
                eq(wardrobeItems.wardrobeId, wardrobeId),
                eq(wardrobeItems.ownerUid, c.get('uid')),
                eq(wardrobeItems.profileId, c.get('profileId'))
            )
        )

    return Response.json(
        { data: items.map(withUserId) },
        { status: 200 }
    )
})

routes.patch('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0')
        if (!id) {
            return Response.json({ error: 'Invalid item id' }, { status: 400 })
        }

        const uid = c.get('uid')
        const body = WardrobeItemUpdateSchema.parse(await c.req.json())

        const rows = await db
            .select()
            .from(wardrobeItems)
            .where(
                and(
                    eq(wardrobeItems.id, id),
                    eq(wardrobeItems.ownerUid, uid),
                    eq(wardrobeItems.profileId, c.get('profileId'))
                )
            )

        if (rows.length === 0) {
            return Response.json({ error: 'Item not found' }, { status: 404 })
        }

        if (
            body.wardrobeId !== undefined &&
            !(await ownsWardrobe(
                body.wardrobeId,
                uid,
                c.get('profileId')
            ))
        ) {
            return Response.json(
                { error: 'Wardrobe not found' },
                { status: 404 }
            )
        }

        const existing = rows[0]
        const updates: Partial<typeof wardrobeItems.$inferInsert> = {}

        if (body.itemName !== undefined) updates.itemName = body.itemName
        if (body.photoUri !== undefined) updates.photoUri = body.photoUri
        if (body.purchaseDate !== undefined) {
            updates.purchaseDate = body.purchaseDate
                ? new Date(body.purchaseDate)
                : null
        }
        if (body.expiryDate !== undefined) {
            updates.expiryDate = body.expiryDate
                ? new Date(body.expiryDate)
                : null
        }
        if (body.price !== undefined) updates.price = body.price
        if (body.brand !== undefined) updates.brand = body.brand
        if (body.category !== undefined) updates.category = body.category
        if (body.color !== undefined) updates.color = body.color
        if (body.size !== undefined) updates.size = body.size
        if (body.wardrobeId !== undefined) {
            updates.wardrobeId = body.wardrobeId
        }

        const [updated] = await db
            .update(wardrobeItems)
            .set(updates)
            .where(
                and(
                    eq(wardrobeItems.id, id),
                    eq(wardrobeItems.ownerUid, uid),
                    eq(wardrobeItems.profileId, c.get('profileId'))
                )
            )
            .returning()

        if (!updated) {
            return Response.json({ error: 'Item not found' }, { status: 404 })
        }

        // Only clean up Storage after the ownership-scoped update succeeded.
        if (
            body.photoUri !== undefined &&
            body.photoUri !== existing.photoUri
        ) {
            await removeStoredPhoto(existing.photoUri)
        }

        return Response.json(
            { data: [withUserId(updated)] },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('Error updating wardrobe item:', error)

        if (error instanceof z.ZodError) {
            return Response.json({ error: error.errors }, { status: 400 })
        }

        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
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
                    eq(wardrobeItems.ownerUid, c.get('uid')),
                    eq(wardrobeItems.profileId, c.get('profileId'))
                )
            )

        if (rows.length === 0) {
            return Response.json({ error: 'Item not found' }, { status: 404 })
        }

        await db
            .delete(wardrobeItems)
            .where(
                and(
                    eq(wardrobeItems.id, id),
                    eq(wardrobeItems.ownerUid, c.get('uid')),
                    eq(wardrobeItems.profileId, c.get('profileId'))
                )
            )
        await removeStoredPhoto(rows[0].photoUri)

        return new Response(null, { status: 204 })
    } catch (error: any) {
        console.error('Error deleting wardrobe item:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

export default routes
