import { getStorage } from 'firebase-admin/storage'

const BUCKET =
    process.env.FIREBASE_STORAGE_BUCKET || 'wardo-ce8d5.firebasestorage.app'

/**
 * Deletes the Firebase Storage object behind a download URL (or a `gs://`
 * URL). Silently ignores values that are not part of the managed bucket.
 */
export async function removeStoredPhoto(photoUri?: string | null) {
    const path = storagePathFromUrl(photoUri)
    if (!path) return

    try {
        await getStorage()
            .bucket(BUCKET)
            .file(path)
            .delete({ ignoreNotFound: true })
    } catch (error) {
        // The row is already gone; a missing or undeletable object should not
        // fail the API request.
        console.warn(`Could not delete storage object ${path}:`, error)
    }
}

function storagePathFromUrl(value?: string | null): string | null {
    const trimmed = value?.trim()
    if (!trimmed) return null

    if (trimmed.startsWith('gs://')) {
        const rest = trimmed.slice('gs://'.length)
        const slash = rest.indexOf('/')
        return slash === -1 ? null : rest.slice(slash + 1)
    }

    try {
        const url = new URL(trimmed)
        if (url.hostname !== 'firebasestorage.googleapis.com') return null

        const marker = '/o/'
        const index = url.pathname.indexOf(marker)
        if (index === -1) return null

        return decodeURIComponent(url.pathname.slice(index + marker.length))
    } catch {
        return null
    }
}
