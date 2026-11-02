import { Hono } from 'hono'
import { mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Minimal local image store.
 *
 * Files are written to `backend/uploads/` and served back from
 * `/api/uploads/:filename`. Swap `UPLOAD_DIR` for an S3/R2-backed
 * implementation before deploying anywhere that has an ephemeral disk.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
const MAX_BYTES = 10 * 1024 * 1024

const EXTENSION_BY_TYPE: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
}

const SAFE_FILENAME = /^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|gif)$/

await mkdir(UPLOAD_DIR, { recursive: true })

/**
 * Removes the stored file behind an `/api/uploads/...` URL, if any.
 * Silently ignores external URLs, malformed values and already-missing files.
 */
export async function removeUploadedFile(photoUri?: string | null) {
    if (!photoUri) return

    let pathname: string
    try {
        pathname = new URL(photoUri).pathname
    } catch {
        return
    }

    const prefix = '/api/uploads/'
    if (!pathname.startsWith(prefix)) return

    const filename = pathname.slice(prefix.length)
    if (!SAFE_FILENAME.test(filename)) return

    try {
        await unlink(join(UPLOAD_DIR, filename))
    } catch {
        // Already gone or unreadable — nothing else to do.
    }
}

const routes = new Hono()

routes.post('/', async (c) => {
    try {
        const body = await c.req.parseBody()
        const file = body['file']

        if (!(file instanceof File)) {
            return Response.json(
                { error: 'Expected a multipart `file` field' },
                { status: 400 }
            )
        }
        if (!file.type.startsWith('image/')) {
            return Response.json(
                { error: 'Only image uploads are supported' },
                { status: 415 }
            )
        }
        if (file.size > MAX_BYTES) {
            return Response.json(
                { error: 'Image must be 10 MB or smaller' },
                { status: 413 }
            )
        }

        const extension =
            EXTENSION_BY_TYPE[file.type] ||
            file.name.split('.').pop()?.toLowerCase() ||
            'bin'
        const filename = `${crypto.randomUUID()}.${extension}`

        await Bun.write(join(UPLOAD_DIR, filename), file)

        const origin = new URL(c.req.url).origin
        return Response.json(
            { data: { url: `${origin}/api/uploads/${filename}` } },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error uploading image:', error)
        return Response.json(
            { error: 'Could not store the image' },
            { status: 500 }
        )
    }
})

routes.get('/:filename', async (c) => {
    const filename = c.req.param('filename')
    if (!SAFE_FILENAME.test(filename)) {
        return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const file = Bun.file(join(UPLOAD_DIR, filename))
    if (!(await file.exists())) {
        return Response.json({ error: 'Not found' }, { status: 404 })
    }

    return new Response(file, {
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
})

export default routes
