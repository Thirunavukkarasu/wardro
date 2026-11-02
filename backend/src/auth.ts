import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { usersTable } from '@/schema'

/**
 * Firebase ID-token verification.
 *
 * Tokens are verified against Google's public JWKS, so no service-account
 * key is needed. The client never sends a user id; identity always comes from
 * the signed token.
 */
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'wardo-ce8d5'
const ISSUER = `https://securetoken.google.com/${PROJECT_ID}`

const JWKS = createRemoteJWKSet(
    new URL(
        'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
    )
)

export type AuthEnv = {
    Variables: {
        uid: string
        userId: number
    }
}

export const requireUser = createMiddleware<AuthEnv>(async (c, next) => {
    const header = c.req.header('Authorization') || ''
    if (!header.toLowerCase().startsWith('bearer ')) {
        return c.json({ error: 'Missing bearer token' }, 401)
    }

    const token = header.slice(7).trim()
    if (!token) {
        return c.json({ error: 'Missing bearer token' }, 401)
    }

    let claims
    try {
        const result = await jwtVerify(token, JWKS, {
            issuer: ISSUER,
            audience: PROJECT_ID,
        })
        claims = result.payload
    } catch (error) {
        console.error('Token verification failed:', error)
        return c.json({ error: 'Invalid or expired token' }, 401)
    }

    const uid = typeof claims.sub === 'string' ? claims.sub : ''
    if (!uid) {
        return c.json({ error: 'Token subject is missing' }, 401)
    }

    const userId = await resolveUserId(
        uid,
        claims.name,
        claims.email,
        claims.email_verified
    )
    c.set('uid', uid)
    c.set('userId', userId)
    await next()
})

/** Maps the provider uid to a local user row, creating it on first use. */
async function resolveUserId(
    uid: string,
    nameClaim: unknown,
    emailClaim: unknown,
    emailVerified: unknown
): Promise<number> {
    const existing = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkId, uid))

    if (existing.length > 0) return existing[0].id

    const name = typeof nameClaim === 'string' ? nameClaim.trim() : ''
    const email = typeof emailClaim === 'string' ? emailClaim.trim() : ''

    // One-time migration from the pre-Firebase user rows: only adopt a row by
    // email when the provider has verified that the caller owns the address.
    if (email && emailVerified === true) {
        const byEmail = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))

        if (byEmail.length === 1) {
            const adopted = await db
                .update(usersTable)
                .set({ clerkId: uid, name: name || byEmail[0].name })
                .where(eq(usersTable.id, byEmail[0].id))
                .returning()

            return adopted[0].id
        }
    }

    const created = await db
        .insert(usersTable)
        .values({
            name: name || email || uid,
            email,
            clerkId: uid,
        })
        .returning()

    return created[0].id
}
