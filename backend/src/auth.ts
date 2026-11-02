import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AuthClaims } from 'firebase-admin/data-connect'
import { ensureUser } from '@wardro/dataconnect-admin'

import { dataConnect } from '@/dataConnect'

/**
 * Firebase ID-token verification.
 *
 * Tokens are verified against Google's public JWKS, so no service-account
 * key is needed. The client never sends a user id; identity always comes from
 * the signed token.
 *
 * The verified claims are also used to impersonate the caller when talking to
 * SQL Connect, so `auth.uid` in the connector evaluates to the real user.
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
        authClaims: AuthClaims
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

    const authClaims = { ...claims, uid, sub: uid } as AuthClaims

    // Wardrobes reference the user row, so make sure it exists before any
    // handler runs. Upserting is idempotent.
    try {
        await ensureUser(
            dataConnect,
            {
                email: typeof claims.email === 'string' ? claims.email : undefined,
                displayName:
                    typeof claims.name === 'string' ? claims.name : undefined,
            },
            { impersonate: { authClaims } }
        )
    } catch (error) {
        console.error('Could not ensure user row:', error)
        return c.json({ error: 'Could not prepare your account' }, 500)
    }

    c.set('uid', uid)
    c.set('authClaims', authClaims)
    await next()
})
