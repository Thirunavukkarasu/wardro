import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { ProfileSchema, ProfileUpdateSchema } from '@/types'
import { db } from '@/db'
import { profiles, wardrobeItems, wardrobes } from '@/schema'
import { requireUser, type AuthEnv } from '@/auth'
import { ensureDefaultProfile } from '@/profile'
import { removeStoredPhoto } from '@/storage'

const routes = new Hono<AuthEnv>()

routes.use('*', requireUser)

// Profiles are account-level; the account always has at least one profile.
routes.get('/', async (c) => {
    try {
        const uid = c.get('uid')
        await ensureDefaultProfile(uid)

        const rows = await db
            .select({
                id: profiles.id,
                userId: profiles.ownerUid,
                name: profiles.name,
                color: profiles.color,
                avatarUrl: profiles.avatarUrl,
                isDefault: profiles.isDefault,
                createdAt: profiles.createdAt,
                wardrobeCount:
                    sql<number>`count(distinct ${wardrobes.id})`.mapWith(
                        Number
                    ),
                itemCount: sql<number>`count(${wardrobeItems.id})`.mapWith(
                    Number
                ),
            })
            .from(profiles)
            .leftJoin(
                wardrobes,
                eq(wardrobes.profileId, profiles.id)
            )
            .leftJoin(
                wardrobeItems,
                eq(wardrobeItems.profileId, profiles.id)
            )
            .where(eq(profiles.ownerUid, uid))
            .groupBy(profiles.id)
            .orderBy(profiles.createdAt)

        return Response.json({ data: rows }, { status: 200 })
    } catch (error) {
        console.error('Error fetching profiles:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
})

routes.post('/', async (c) => {
    try {
        const body = ProfileSchema.parse(await c.req.json())

        const [created] = await db
            .insert(profiles)
            .values({
                ownerUid: c.get('uid'),
                name: body.name,
                color: body.color ?? '#4F46E5',
                avatarUrl: body.avatarUrl ?? null,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning()

        return Response.json(
            { data: [{ ...created, userId: created.ownerUid }] },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Error creating profile:', error)

        if (error instanceof z.ZodError) {
            return Response.json({ error: error.errors }, { status: 400 })
        }

        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
})

routes.patch('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0')
        if (!id) {
            return Response.json(
                { error: 'Invalid profile id' },
                { status: 400 }
            )
        }

        const body = ProfileUpdateSchema.parse(await c.req.json())
        const updates: Partial<typeof profiles.$inferInsert> = {}

        if (body.name !== undefined) updates.name = body.name
        if (body.color !== undefined) updates.color = body.color
        if (body.avatarUrl !== undefined) {
            updates.avatarUrl = body.avatarUrl
        }

        if (Object.keys(updates).length === 0) {
            return Response.json(
                { error: 'No fields to update' },
                { status: 400 }
            )
        }

        updates.updatedAt = new Date()

        const [updated] = await db
            .update(profiles)
            .set(updates)
            .where(
                and(
                    eq(profiles.id, id),
                    eq(profiles.ownerUid, c.get('uid'))
                )
            )
            .returning()

        if (!updated) {
            return Response.json(
                { error: 'Profile not found' },
                { status: 404 }
            )
        }

        return Response.json(
            { data: [{ ...updated, userId: updated.ownerUid }] },
            { status: 200 }
        )
    } catch (error: any) {
        console.error('Error updating profile:', error)

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
            return Response.json(
                { error: 'Invalid profile id' },
                { status: 400 }
            )
        }

        const uid = c.get('uid')

        const [{ count }] = await db
            .select({
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(profiles)
            .where(eq(profiles.ownerUid, uid))

        if (count <= 1) {
            return Response.json(
                { error: 'At least one profile is required' },
                { status: 400 }
            )
        }

        const [profile] = await db
            .select()
            .from(profiles)
            .where(
                and(
                    eq(profiles.id, id),
                    eq(profiles.ownerUid, uid)
                )
            )

        if (!profile) {
            return Response.json(
                { error: 'Profile not found' },
                { status: 404 }
            )
        }

        // Collect photos before the cascade removes the item rows.
        const items = await db
            .select({ photoUri: wardrobeItems.photoUri })
            .from(wardrobeItems)
            .where(
                and(
                    eq(wardrobeItems.profileId, id),
                    eq(wardrobeItems.ownerUid, uid)
                )
            )

        await db
            .delete(profiles)
            .where(
                and(
                    eq(profiles.id, id),
                    eq(profiles.ownerUid, uid)
                )
            )

        await Promise.all(
            items.map((item) => removeStoredPhoto(item.photoUri))
        )

        return new Response(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting profile:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
})

export default routes
