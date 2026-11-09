import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const MAX_HTML_BYTES = 1_000_000
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_REDIRECTS = 3
const FETCH_TIMEOUT_MS = 10_000
const USER_AGENT =
    'WardroBot/1.0 (+https://wardro-lake.vercel.app; item import)'

export type ProductPage = {
    url: string
    title: string | null
    description: string | null
    imageUrl: string | null
    price: number | null
    currency: string | null
    siteName: string | null
    text: string
}

export type RemoteImage = {
    buffer: Buffer
    contentType: string
}

/**
 * Fetch and extract product metadata from a public HTML page.
 * This never executes scripts; the model only sees the extracted text.
 */
export async function fetchProductPage(input: string): Promise<ProductPage> {
    const { body, url } = await fetchFollowingRedirects(
        input,
        'text/html,application/xhtml+xml',
        MAX_HTML_BYTES
    )
    return extractProductPage(new TextDecoder().decode(body), url)
}

/** Download a product image for import, with the same SSRF protections. */
export async function fetchRemoteImage(
    input: string
): Promise<RemoteImage> {
    const { body, contentType } = await fetchFollowingRedirects(
        input,
        'image/*',
        MAX_IMAGE_BYTES
    )

    const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ]
    if (!allowed.includes(contentType)) {
        throw new Error('The product image type is not supported.')
    }

    return { buffer: Buffer.from(body), contentType }
}

export function extractProductPage(
    html: string,
    pageUrl: string
): ProductPage {
    const meta = metaMap(html)
    const product = productJsonLd(html)

    const title =
        clean(meta.get('og:title')) ??
        clean(meta.get('twitter:title')) ??
        clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]) ??
        clean(product?.name)

    const description =
        clean(meta.get('og:description')) ??
        clean(meta.get('description')) ??
        clean(product?.description)

    const rawImage =
        meta.get('og:image') ??
        meta.get('og:image:secure_url') ??
        meta.get('twitter:image') ??
        imageFromProduct(product)

    const price =
        numberFrom(productOffer(product)?.price) ??
        numberFrom(meta.get('product:price:amount')) ??
        numberFrom(meta.get('og:price:amount'))

    const currency =
        clean(productOffer(product)?.priceCurrency) ??
        clean(meta.get('product:price:currency')) ??
        clean(meta.get('og:price:currency'))

    return {
        url: pageUrl,
        title,
        description,
        imageUrl: absoluteUrl(rawImage, pageUrl),
        price,
        currency,
        siteName: clean(meta.get('og:site_name')),
        text: visibleText(html),
    }
}

async function fetchFollowingRedirects(
    input: string,
    accept: string,
    maxBytes: number
): Promise<{ body: Uint8Array; contentType: string; url: string }> {
    let current = new URL(input)

    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
        await assertPublicUrl(current)

        const response = await fetch(current, {
            redirect: 'manual',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {
                accept,
                'user-agent': USER_AGENT,
            },
        })

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location')
            if (!location) throw new Error('The page redirected without a location.')
            if (redirect === MAX_REDIRECTS) throw new Error('Too many redirects.')
            current = new URL(location, current)
            continue
        }

        if (!response.ok) {
            throw new Error(`The page returned HTTP ${response.status}.`)
        }

        const contentType = (
            response.headers.get('content-type') ?? ''
        )
            .split(';')[0]
            .trim()
            .toLowerCase()

        if (
            accept.startsWith('text/') &&
            !contentType.includes('text/html') &&
            !contentType.includes('application/xhtml+xml')
        ) {
            throw new Error('The URL is not an HTML page.')
        }

        return {
            body: await readLimitedBody(response, maxBytes),
            contentType,
            url: current.toString(),
        }
    }

    throw new Error('Too many redirects.')
}

async function readLimitedBody(
    response: Response,
    maxBytes: number
): Promise<Uint8Array> {
    if (!response.body) return new Uint8Array()

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > maxBytes) {
            await reader.cancel()
            throw new Error('The remote file is too large to import.')
        }
        chunks.push(value)
    }

    const result = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.byteLength
    }
    return result
}

export async function assertPublicUrl(url: URL): Promise<void> {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Only http and https URLs are supported.')
    }
    if (url.username || url.password) {
        throw new Error('URLs with credentials are not supported.')
    }
    if (url.port && url.port !== '80' && url.port !== '443') {
        throw new Error('Only ports 80 and 443 are supported.')
    }

    const host = url.hostname.toLowerCase()
    if (
        host === 'localhost' ||
        host.endsWith('.localhost') ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        host === 'metadata.google.internal'
    ) {
        throw new Error('That host is not allowed.')
    }

    const literal = isIP(host)
    if (literal) {
        if (isPrivateAddress(host)) throw new Error('That host is not allowed.')
        return
    }

    const addresses = await lookup(host, { all: true })
    if (addresses.length === 0) {
        throw new Error('Could not resolve that host.')
    }
    if (addresses.some((entry) => isPrivateAddress(entry.address))) {
        throw new Error('That host is not allowed.')
    }
}

function isPrivateAddress(address: string): boolean {
    const version = isIP(address)

    if (version === 4) {
        const [a, b] = address.split('.').map(Number)
        return (
            a === 0 ||
            a === 10 ||
            a === 127 ||
            (a === 100 && b >= 64 && b <= 127) ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            (a === 192 && b === 0) ||
            (a === 198 && (b === 18 || b === 19)) ||
            (a === 198 && b === 51) ||
            (a === 203 && b === 0) ||
            a >= 224
        )
    }

    if (version === 6) {
        const lower = address.toLowerCase()
        if (lower === '::' || lower === '::1') return true
        if (lower.startsWith('fc') || lower.startsWith('fd')) return true
        if (lower.startsWith('fe8') || lower.startsWith('fe9')) return true
        if (lower.startsWith('fea') || lower.startsWith('feb')) return true
        if (lower.startsWith('::ffff:')) {
            return isPrivateAddress(lower.slice('::ffff:'.length))
        }
        return false
    }

    return true
}

function metaMap(html: string): Map<string, string> {
    const map = new Map<string, string>()

    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
        const tag = match[0]
        const key =
            /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
        const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]
        if (key && content) map.set(key.toLowerCase(), decodeEntities(content))
    }

    return map
}

type JsonObject = Record<string, unknown>

function productJsonLd(html: string): JsonObject | null {
    for (const match of html.matchAll(
        /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )) {
        try {
            const parsed = JSON.parse(decodeEntities(match[1].trim()))
            const found = findProduct(parsed)
            if (found) return found
        } catch {
            // Ignore malformed structured data and try the next block.
        }
    }
    return null
}

function findProduct(value: unknown): JsonObject | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const found = findProduct(item)
            if (found) return found
        }
        return null
    }

    if (!value || typeof value !== 'object') return null
    const object = value as JsonObject

    const types = Array.isArray(object['@type'])
        ? object['@type']
        : [object['@type']]
    if (types.some((type) => String(type).toLowerCase() === 'product')) {
        return object
    }

    return findProduct(object['@graph'])
}

function productOffer(product: JsonObject | null): JsonObject | null {
    if (!product) return null
    const offers = product.offers
    if (Array.isArray(offers)) {
        return (offers[0] as JsonObject | undefined) ?? null
    }
    return offers && typeof offers === 'object'
        ? (offers as JsonObject)
        : null
}

function imageFromProduct(product: JsonObject | null): string | null {
    if (!product) return null
    const image = product.image
    if (typeof image === 'string') return image
    if (Array.isArray(image)) {
        for (const entry of image) {
            if (typeof entry === 'string') return entry
            if (entry && typeof entry === 'object') {
                const url = (entry as JsonObject).url
                if (typeof url === 'string') return url
            }
        }
    }
    if (image && typeof image === 'object') {
        const url = (image as JsonObject).url
        if (typeof url === 'string') return url
    }
    return null
}

function visibleText(html: string): string {
    return decodeEntities(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
    )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 6_000)
}

function absoluteUrl(value: string | null, base: string): string | null {
    if (!value) return null
    try {
        const url = new URL(value, base)
        return url.protocol === 'http:' || url.protocol === 'https:'
            ? url.toString()
            : null
    } catch {
        return null
    }
}

function numberFrom(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value !== 'string') return null
    const parsed = Number.parseFloat(value.replace(/[^0-9.,-]/g, '').replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
}

function clean(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const trimmed = decodeEntities(value).replace(/\s+/g, ' ').trim()
    return trimmed || null
}

function decodeEntities(value: string): string {
    return value
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#0*39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#(\d+);/g, (_, code: string) =>
            String.fromCharCode(Number(code))
        )
}
