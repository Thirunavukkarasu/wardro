import type { Context } from 'hono'

/**
 * Public origin used to build photo URLs.
 *
 * Cloud Run's request URL can be the internal container URL, so building
 * `photoUri` from `c.req.url` can produce localhost URLs that a phone cannot
 * reach. `PUBLIC_API_ORIGIN` pins the deployed origin; the forwarded headers
 * and finally the request origin are fallbacks for local development.
 */
export function requestOrigin(c: Context): string {
    const configured = process.env.PUBLIC_API_ORIGIN?.trim()
    if (configured) return configured.replace(/\/+$/, '')

    const forwardedHost = c.req.header('x-forwarded-host')
    if (forwardedHost) {
        const proto =
            c.req.header('x-forwarded-proto') ||
            new URL(c.req.url).protocol.replace(':', '')
        return `${proto}://${forwardedHost}`.replace(/\/+$/, '')
    }

    return new URL(c.req.url).origin
}
