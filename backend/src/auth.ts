import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'

import { db } from '@/db'
import { users } from '@/schema'

/**
 * Firebase ID-token verification.
 *
 * Tokens are verified against Google's public JWKS, so no service-account
 * key is needed. The client never sends a user id; identity always comes from
 * the signed token. The uid becomes `owner_uid` on every row.
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

    // First request creates the user row; later requests only refresh the
    // profile fields when the provider actually supplied them.
    try {
        await db
            .insert(users)
            .values({
                uid,
                email: typeof claims.email === 'string' ? claims.email : null,
                displayName:
                    typeof claims.name === 'string' ? claims.name : null,
                createdAt: new Date(),
            })
            .onConflictDoUpdate({
                target: users.uid,
                set: {
                    email: sql`coalesce(excluded.email, ${users.email})`,
                    displayName: sql`coalesce(excluded.display_name, ${users.displayName})`,
                },
            })
    } catch (error) {
        console.error('Could not ensure user row:', error)
        return c.json({ error: 'Could not prepare your account' }, 500)
    }

    c.set('uid', uid)
    await next()
})
