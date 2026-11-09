import { Hono } from 'hono'
import { z } from 'zod'

import {
    DraftError,
    DraftUnavailableError,
    draftFromImage,
    draftFromUrl,
} from '@/ai/item-draft'
import { requestOrigin } from '@/origin'
import { requireUser, type AuthEnv } from '@/auth'
import { photoUrl } from '@/storage'

const routes = new Hono<AuthEnv>()

const DraftRequestSchema = z
    .object({
        imageBase64: z.string().max(14_000_000).optional(),
        contentType: z
            .string()
            .regex(/^image\//i, 'Only image content types are supported.')
            .optional(),
        url: z.string().url('Enter a valid URL.').optional(),
        hint: z.string().max(300).optional(),
    })
    .refine(
        (value) => Boolean(value.imageBase64) !== Boolean(value.url),
        'Send exactly one of imageBase64 or url.'
    )

const DRAFT_REQUESTS_PER_MINUTE = 30
const windows = new Map<string, number[]>()

function isRateLimited(uid: string): boolean {
    const now = Date.now()
    const recent = (windows.get(uid) ?? []).filter(
        (timestamp) => now - timestamp < 60_000
    )
    if (recent.length >= DRAFT_REQUESTS_PER_MINUTE) {
        windows.set(uid, recent)
        return true
    }
    recent.push(now)
    windows.set(uid, recent)

    if (windows.size > 1_000) {
        for (const [key, values] of windows) {
            if (now - (values.at(-1) ?? 0) > 60_000) windows.delete(key)
        }
    }
    return false
}

/**
 * Turns a photo or a product URL into an editable item draft. This endpoint
 * never writes a wardrobe row; the client reviews the values and saves them
 * through POST/PATCH /wardrobeItems.
 */
routes.post('/item-draft', requireUser, async (c) => {
    if (isRateLimited(c.get('uid'))) {
        return Response.json(
            { error: 'Too many auto-fill requests. Try again in a minute.' },
            { status: 429 }
        )
    }

    let body: unknown
    try {
        body = await c.req.json()
    } catch {
        return Response.json({ error: 'Send a JSON body.' }, { status: 400 })
    }

    const parsed = DraftRequestSchema.safeParse(body)
    if (!parsed.success) {
        return Response.json(
            { error: parsed.error.errors[0]?.message ?? 'Invalid request.' },
            { status: 400 }
        )
    }

    try {
        const result = parsed.data.imageBase64
            ? await draftFromImage({
                  imageBase64: parsed.data.imageBase64,
                  contentType: parsed.data.contentType ?? 'image/jpeg',
                  hint: parsed.data.hint,
              })
            : await draftFromUrl({
                  url: parsed.data.url!,
                  uid: c.get('uid'),
              })

        const origin = requestOrigin(c)
        return Response.json({
            data: {
                ...result.draft,
                photoPath: result.photoPath,
                photoUri: result.photoPath
                    ? photoUrl(result.photoPath, origin)
                    : null,
                source: result.source,
            },
        })
    } catch (error) {
        if (error instanceof DraftUnavailableError) {
            return Response.json({ error: error.message }, { status: 503 })
        }
        if (error instanceof DraftError) {
            return Response.json({ error: error.message }, { status: 422 })
        }

        console.error('Item draft failed:', error)
        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Could not create an item draft.',
            },
            { status: 422 }
        )
    }
})

export default routes
