import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { WardrobeSchema, WardrobeUpdateSchema } from '@/types'
import { db } from '@/db'
import { wardrobeItems, wardrobes } from '@/schema'
import { requireUser } from '@/auth'
import { requireProfile, type ProfileEnv } from '@/profile'
import { presentPhotoUri, removeStoredPhoto } from '@/storage'

const routes = new Hono<ProfileEnv>()

// Every route below acts on the user named by the verified Firebase token and
// the profile named by X-Profile-Id.
routes.use('*', requireUser, requireProfile)

routes.post('/', async (c) => {
    try {
        const wardrobe = WardrobeSchema.parse(await c.req.json())

        const [created] = await db
            .insert(wardrobes)
            .values({
                ownerUid: c.get('uid'),
                profileId: c.get('profileId'),
                name: wardrobe.name,
                description: wardrobe.description ?? '',
                createdAt: new Date(),
            })
            .returning()

        return Response.json(
            { data: [{ ...created, userId: created.ownerUid }] },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating wardrobe:', error)
        return Response.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
})

routes.get('/summary', async (c) => {
    try {
        const response = await db
            .select({
                id: wardrobes.id,
                userId: wardrobes.ownerUid,
                name: wardrobes.name,
                description: wardrobes.description,
                createdAt: wardrobes.createdAt,
                itemCount: sql<number>`count(${wardrobeItems.id})`.mapWith(Number),
                totalValue:
                    sql<number>`coalesce(sum(${wardrobeItems.price}), 0)`.mapWith(
                        Number
                    ),
                coverPhotoUri: sql<
                    string | null
                >`max(nullif(${wardrobeItems.photoUri}, ''))`,
            })
            .from(wardrobes)
            .leftJoin(
                wardrobeItems,
                eq(wardrobeItems.wardrobeId, wardrobes.id)
            )
            .where(
                and(
                    eq(wardrobes.ownerUid, c.get('uid')),
                    eq(wardrobes.profileId, c.get('profileId'))
                )
            )
            .groupBy(wardrobes.id)
            .orderBy(wardrobes.createdAt)

        const origin = new URL(c.req.url).origin

        return Response.json(
            {
                data: response.map((row) => ({
                    ...row,
                    coverPhotoUri: row.coverPhotoUri
                        ? presentPhotoUri(row.coverPhotoUri, origin)
                        : row.coverPhotoUri,
                })),
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching wardrobe summary:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

routes.get('/', async (c) => {
    try {
        const rows = await db
            .select()
            .from(wardrobes)
            .where(
                and(
                    eq(wardrobes.ownerUid, c.get('uid')),
                    eq(wardrobes.profileId, c.get('profileId'))
                )
            )

        return Response.json(
            { data: rows.map((row) => ({ ...row, userId: row.ownerUid })) },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching wardrobes:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

routes.patch('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0')
        if (!id) {
            return Response.json({ error: 'Invalid wardrobe id' }, { status: 400 })
        }

        const body = WardrobeUpdateSchema.parse(await c.req.json())
        const updates: Partial<typeof wardrobes.$inferInsert> = {}

        if (body.name !== undefined) updates.name = body.name
        if (body.description !== undefined) {
            updates.description = body.description
        }

        if (Object.keys(updates).length === 0) {
            return Response.json(
                { error: 'No fields to update' },
                { status: 400 }
            )
        }

        const [updated] = await db
            .update(wardrobes)
            .set(updates)
            .where(
                and(
                    eq(wardrobes.id, id),
                    eq(wardrobes.ownerUid, c.get('uid')),
                    eq(wardrobes.profileId, c.get('profileId'))
                )
            )
            .returning()

        if (!updated) {
            return Response.json(
                { error: 'Wardrobe not found' },
                { status: 404 }
            )
        }

        return Response.json(
            { data: [{ ...updated, userId: updated.ownerUid }] },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error updating wardrobe:', error)
        return Response.json(
            { error: (error as Error).message },
            { status: 400 }
        )
    }
})

routes.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0')
        if (!id) {
            return Response.json({ error: 'Invalid wardrobe id' }, { status: 400 })
        }

        const uid = c.get('uid')
        const items = await db
            .select({ photoUri: wardrobeItems.photoUri })
            .from(wardrobeItems)
            .where(
                and(
                    eq(wardrobeItems.wardrobeId, id),
                    eq(wardrobeItems.ownerUid, uid),
                    eq(wardrobeItems.profileId, c.get('profileId'))
                )
            )

        const deleted = await db
            .delete(wardrobes)
            .where(
                and(
                    eq(wardrobes.id, id),
                    eq(wardrobes.ownerUid, uid),
                    eq(wardrobes.profileId, c.get('profileId'))
                )
            )
            .returning({ id: wardrobes.id })

        if (deleted.length === 0) {
            return Response.json({ error: 'Wardrobe not found' }, { status: 404 })
        }

        // Only clean up Storage after the ownership-scoped delete succeeded.
        await Promise.all(items.map((item) => removeStoredPhoto(item.photoUri)))

        return new Response(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting wardrobe:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

export default routes
