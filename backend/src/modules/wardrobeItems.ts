import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import {
    WardrobeItemSchema,
    WardrobeItemUpdateSchema,
} from '@/types'
import { requestOrigin } from '@/origin'
import { db } from '@/db'
import { wardrobeItems, wardrobes } from '@/schema'
import { requireUser } from '@/auth'
import { requireProfile, type ProfileEnv } from '@/profile'
import {
    photoBelongsToUser,
    photoPathFromUrl,
    presentPhotoUri,
    removeStoredPhoto,
} from '@/storage'

const routes = new Hono<ProfileEnv>()

routes.use('*', requireUser, requireProfile)

const withUserId = <T extends { ownerUid: string; photoUri: string | null }>(
    row: T,
    origin: string
) => ({
    ...row,
    userId: row.ownerUid,
    photoUri: presentPhotoUri(row.photoUri, origin),
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

        if (item.photoUri && !photoBelongsToUser(item.photoUri, uid)) {
            return Response.json(
                { error: 'Photo does not belong to this account' },
                { status: 400 }
            )
        }

        if (!(await ownsWardrobe(item.wardrobeId, uid, c.get('profileId')))) {
            return Response.json(
                { error: 'Wardrobe not found' },
                { status: 404 }
            )
        }

        const photoUri = item.photoUri
            ? (photoPathFromUrl(item.photoUri) ?? item.photoUri)
            : ''

        const [created] = await db
            .insert(wardrobeItems)
            .values({
                ownerUid: uid,
                profileId: c.get('profileId'),
                wardrobeId: item.wardrobeId,
                itemName: item.itemName,
                photoUri,
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
            { data: [withUserId(created, requestOrigin(c))] },
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
        {
            data: items.map((item) =>
                withUserId(item, requestOrigin(c))
            ),
        },
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
        {
            data: items.map((item) =>
                withUserId(item, requestOrigin(c))
            ),
        },
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

        if (
            body.photoUri !== undefined &&
            !photoBelongsToUser(body.photoUri, uid)
        ) {
            return Response.json(
                { error: 'Photo does not belong to this account' },
                { status: 400 }
            )
        }

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
        if (body.photoUri !== undefined) {
            updates.photoUri =
                photoPathFromUrl(body.photoUri) ?? body.photoUri
        }
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

        // A presentPhotoUri round-trip can change the URL form while pointing
        // at the same object, so compare object paths rather than strings.
        if (body.photoUri !== undefined) {
            const nextPath = photoPathFromUrl(body.photoUri)
            const previousPath = photoPathFromUrl(existing.photoUri)
            if (nextPath !== previousPath) {
                await removeStoredPhoto(existing.photoUri)
            }
        }

        return Response.json(
            { data: [withUserId(updated, requestOrigin(c))] },
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
