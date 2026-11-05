import { and, eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'

import { db } from '@/db'
import { profiles, users } from '@/schema'

/**
 * Profile-scoped request environment. `requireUser` sets the account uid and
 * `requireProfile` verifies (or resolves) the active profile.
 */
export type ProfileEnv = {
    Variables: {
        uid: string
        profileId: number
    }
}

/**
 * Ensures the account has at least one profile and exactly one default.
 * Safe to call on every profile-scoped request; the common path is one select.
 */
export async function ensureDefaultProfile(uid: string) {
    const [existingDefault] = await db
        .select()
        .from(profiles)
        .where(
            and(
                eq(profiles.ownerUid, uid),
                eq(profiles.isDefault, true)
            )
        )
        .limit(1)

    if (existingDefault) return existingDefault

    const [existing] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.ownerUid, uid))
        .limit(1)

    if (existing) {
        const [updated] = await db
            .update(profiles)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(profiles.id, existing.id))
            .returning()
        return updated ?? existing
    }

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.uid, uid))
        .limit(1)

    const name =
        user?.displayName?.trim() ||
        user?.email?.split('@')[0] ||
        'My Wardrobe'

    const [created] = await db
        .insert(profiles)
        .values({
            ownerUid: uid,
            name,
            color: '#4F46E5',
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning()

    if (created) return created

    // A concurrent request won the race; use whatever exists now.
    const [fallback] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.ownerUid, uid))
        .limit(1)

    return fallback
}

/**
 * Resolves the active profile from `X-Profile-Id`, falling back to the
 * account's default profile for older clients and first requests.
 */
export const requireProfile = createMiddleware<ProfileEnv>(async (c, next) => {
    const uid = c.get('uid')
    const header = c.req.header('x-profile-id')

    let profileId = 0

    if (header) {
        const parsed = Number(header)
        if (!Number.isInteger(parsed) || parsed <= 0) {
            return c.json({ error: 'Invalid profile id' }, 400)
        }
        profileId = parsed
    } else {
        const fallback = await ensureDefaultProfile(uid)
        if (!fallback) {
            return c.json({ error: 'No profile available' }, 400)
        }
        profileId = fallback.id
    }

    const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(
            and(
                eq(profiles.id, profileId),
                eq(profiles.ownerUid, uid)
            )
        )
        .limit(1)

    if (!profile) {
        return c.json({ error: 'Profile not found' }, 404)
    }

    c.set('profileId', profileId)
    await next()
})
