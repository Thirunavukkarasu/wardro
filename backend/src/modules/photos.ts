import { Hono } from 'hono'

import { requireUser, type AuthEnv } from '@/auth'
import {
    isPhotoSignatureValid,
    photoUrl,
    readStoredPhoto,
    uploadStoredPhoto,
} from '@/storage'

const routes = new Hono<AuthEnv>()

/**
 * Upload a photo. The owner uid comes from the verified Firebase token, never
 * from the request body, so a caller can only write under their own folder.
 */
routes.post('/', requireUser, async (c) => {
    let body: { base64?: unknown; contentType?: unknown }
    try {
        body = await c.req.json()
    } catch {
        return Response.json({ error: 'Send a JSON body.' }, { status: 400 })
    }

    const raw = typeof body.base64 === 'string' ? body.base64.trim() : ''
    // Accept a data URI defensively; the app normally sends raw base64.
    const base64 =
        raw.startsWith('data:') && raw.includes(',')
            ? (raw.split(',').pop() ?? '').trim()
            : raw
    const contentType =
        typeof body.contentType === 'string'
            ? body.contentType.toLowerCase().split(';')[0].trim()
            : ''

    if (!base64) {
        return Response.json(
            { error: 'The selected photo is empty.' },
            { status: 400 }
        )
    }
    if (base64.length > 14_000_000) {
        return Response.json(
            { error: 'Photos must be smaller than 10 MB.' },
            { status: 400 }
        )
    }
    if (!contentType.startsWith('image/')) {
        return Response.json(
            { error: 'Only image uploads are allowed.' },
            { status: 400 }
        )
    }
    if (contentType === 'image/svg+xml') {
        return Response.json(
            { error: 'SVG uploads are not supported.' },
            { status: 400 }
        )
    }

    try {
        const path = await uploadStoredPhoto({
            uid: c.get('uid'),
            base64,
            contentType,
        })
        const origin = new URL(c.req.url).origin

        return Response.json(
            { data: { photoUri: photoUrl(path, origin) } },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error uploading photo:', error)
        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Could not upload the photo.',
            },
            { status: 400 }
        )
    }
})

/**
 * Serve a photo. The URL signature is the capability, so this route needs no
 * Authorization header and works in web <img> elements as well as native
 * Image components.
 */
routes.get('/*', async (c) => {
    const url = new URL(c.req.url)
    const marker = '/api/photos/'
    const index = url.pathname.indexOf(marker)
    let path = ''
    if (index !== -1) {
        try {
            path = decodeURIComponent(url.pathname.slice(index + marker.length))
        } catch {
            // Malformed percent-encoding cannot name a managed photo.
        }
    }

    if (!path || !isPhotoSignatureValid(path, url.searchParams.get('sig'))) {
        return new Response(null, { status: 403 })
    }

    try {
        const photo = await readStoredPhoto(path)
        if (!photo) return new Response(null, { status: 404 })

        const headers: Record<string, string> = {
            'Content-Type': photo.contentType,
            'Cache-Control': 'private, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
        }
        if (photo.size) headers['Content-Length'] = String(photo.size)

        return new Response(photo.stream, { status: 200, headers })
    } catch (error) {
        console.error('Error reading photo:', error)
        return new Response(null, { status: 500 })
    }
})

export default routes
