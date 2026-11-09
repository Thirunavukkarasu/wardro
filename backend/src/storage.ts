import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { Readable } from 'node:stream'

import { Storage } from '@google-cloud/storage'

/**
 * Photo storage on Google Cloud Storage.
 *
 * Firebase is used only for authentication. Photos are written and read by
 * this API; the client never talks to a storage SDK. The bucket stays private
 * and is reached with the Cloud Run runtime service account's IAM role.
 */
const BUCKET =
    process.env.GCS_PHOTOS_BUCKET || 'wardo-ce8d5-wardrobe-photos'

const PHOTO_SECRET =
    process.env.PHOTO_URL_SECRET ||
    (process.env.NODE_ENV === 'production' ? '' : 'wardo-local-photo-secret')

if (!PHOTO_SECRET) {
    throw new Error('PHOTO_URL_SECRET must be set in production')
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const PHOTO_PATH_PATTERN = /^users\/[^/]+\/items\/[^/]+$/

const storage = new Storage()

function signPath(path: string): string {
    return createHmac('sha256', PHOTO_SECRET).update(path).digest('base64url')
}

/**
 * The stable URL stored as `photoUri`. The signature is a capability: it lets
 * `<img>` / native `Image` load the photo without an Authorization header,
 * while the object path itself stays unguessable and the bucket stays private.
 */
export function photoUrl(path: string, origin: string): string {
    return `${origin}/api/photos/${path}?sig=${signPath(path)}`
}

export function isPhotoSignatureValid(
    path: string,
    signature: string | null
): boolean {
    if (!signature || !PHOTO_PATH_PATTERN.test(path)) return false

    const provided = Uint8Array.from(Buffer.from(signature))
    const expected = Uint8Array.from(Buffer.from(signPath(path)))
    return (
        provided.length === expected.length &&
        timingSafeEqual(provided, expected)
    )
}

/**
 * Extracts the object path from any URL form used by this app: the signed API
 * URL, a `gs://` URL, or a legacy Firebase Storage download URL.
 */
export function photoPathFromUrl(value?: string | null): string | null {
    const trimmed = value?.trim()
    if (!trimmed) return null

    // New rows store only the bucket-relative object path.
    if (PHOTO_PATH_PATTERN.test(trimmed)) return trimmed

    if (trimmed.startsWith('gs://')) {
        const rest = trimmed.slice('gs://'.length)
        const slash = rest.indexOf('/')
        if (slash === -1) return null
        return validPath(rest.slice(slash + 1))
    }

    try {
        const url = new URL(trimmed)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

        const apiMarker = '/api/photos/'
        const apiIndex = url.pathname.indexOf(apiMarker)
        if (apiIndex !== -1) {
            return validPath(
                decodeURIComponent(url.pathname.slice(apiIndex + apiMarker.length))
            )
        }

        // Legacy rows point at Firebase's download endpoint, which serves the
        // same GCS object. Keep parsing them so deletes and reads still work.
        if (url.hostname === 'firebasestorage.googleapis.com') {
            const marker = '/o/'
            const index = url.pathname.indexOf(marker)
            if (index === -1) return null
            return validPath(
                decodeURIComponent(url.pathname.slice(index + marker.length))
            )
        }
    } catch {
        return null
    }

    return null
}

function validPath(path: string): string | null {
    return PHOTO_PATH_PATTERN.test(path) ? path : null
}

/** Rewrites a stored legacy URL to the signed API URL for API responses. */
export function presentPhotoUri(
    photoUri: string | null | undefined,
    origin: string
): string {
    const path = photoPathFromUrl(photoUri)
    return path ? photoUrl(path, origin) : (photoUri ?? '')
}

/** True when a photo URL is external or belongs to the given account. */
export function photoBelongsToUser(photoUri: string, uid: string): boolean {
    const path = photoPathFromUrl(photoUri)
    return !path || path.startsWith(`users/${uid}/items/`)
}

export async function uploadStoredPhoto(input: {
    uid: string
    base64: string
    contentType: string
}): Promise<string> {
    return uploadStoredPhotoBuffer({
        uid: input.uid,
        buffer: Buffer.from(input.base64, 'base64'),
        contentType: input.contentType,
    })
}

export async function uploadStoredPhotoBuffer(input: {
    uid: string
    buffer: Buffer
    contentType: string
}): Promise<string> {
    if (input.buffer.length === 0) {
        throw new Error('The selected photo is empty.')
    }
    if (input.buffer.length > MAX_PHOTO_BYTES) {
        throw new Error('Photos must be smaller than 10 MB.')
    }

    const extension = extensionForContentType(input.contentType)
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${extension}`
    const path = `users/${input.uid}/items/${name}`

    await storage.bucket(BUCKET).file(path).save(input.buffer, {
        resumable: false,
        contentType: input.contentType,
        metadata: { cacheControl: 'private, max-age=31536000, immutable' },
    })

    return path
}

function extensionForContentType(contentType: string): string {
    switch (contentType.toLowerCase()) {
        case 'image/png':
            return 'png'
        case 'image/webp':
            return 'webp'
        case 'image/gif':
            return 'gif'
        default:
            return 'jpg'
    }
}

export async function readStoredPhoto(path: string) {
    const file = storage.bucket(BUCKET).file(path)

    let metadata
    try {
        ;[metadata] = await file.getMetadata()
    } catch (error) {
        if ((error as { code?: number }).code === 404) return null
        throw error
    }

    return {
        stream: Readable.toWeb(
            file.createReadStream()
        ) as unknown as ReadableStream<Uint8Array>,
        contentType: metadata.contentType || 'application/octet-stream',
        size: Number(metadata.size ?? 0) || null,
    }
}

/**
 * Deletes the GCS object behind a photo URL. Silently ignores values that do
 * not point at a managed photo path.
 */
export async function removeStoredPhoto(photoUri?: string | null) {
    const path = photoPathFromUrl(photoUri)
    if (!path) return

    try {
        await storage
            .bucket(BUCKET)
            .file(path)
            .delete({ ignoreNotFound: true })
    } catch (error) {
        // The row is already gone; a missing or undeletable object should not
        // fail the API request.
        console.warn(`Could not delete storage object ${path}:`, error)
    }
}
