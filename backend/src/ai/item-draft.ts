import { createOpenAI } from '@ai-sdk/openai'
import {
    Output,
    extractJsonMiddleware,
    generateText,
    wrapLanguageModel,
    type ModelMessage,
} from 'ai'
import { z } from 'zod'

import { uploadStoredPhotoBuffer } from '@/storage'
import { fetchProductPage, fetchRemoteImage, type ProductPage } from '@/ai/url-import'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export const ItemDraftSchema = z.object({
    itemName: z.string().trim().min(1).max(120),
    brand: z.string().trim().max(80).nullable().optional(),
    category: z.string().trim().max(80).nullable().optional(),
    color: z.string().trim().max(60).nullable().optional(),
    size: z.string().trim().max(40).nullable().optional(),
    price: z.number().nonnegative().nullable().optional(),
    currency: z.string().trim().max(8).nullable().optional(),
    purchaseDate: z.string().trim().max(32).nullable().optional(),
    description: z.string().trim().max(400).nullable().optional(),
    confidence: z.number().min(0).max(1).optional(),
})

export type ItemDraft = z.infer<typeof ItemDraftSchema>

export type DraftResult = {
    draft: ItemDraft
    photoPath: string | null
    source: 'ai' | 'metadata'
}

export class DraftUnavailableError extends Error {}
export class DraftError extends Error {}

const SYSTEM_PROMPT = `You catalogue wardrobe items for a personal closet app.
Return ONLY a JSON object with exactly these keys:
itemName, brand, category, color, size, price, currency, purchaseDate, description, confidence.

Rules:
- itemName is a short human-friendly name, e.g. "Black Crew T-Shirt".
- brand, category, color and size are short strings, or null when unknown.
- price is a number or null. currency is an ISO code such as "INR" or null.
- purchaseDate is YYYY-MM-DD or null. Never guess a date.
- description is one sentence, or null.
- confidence is a number from 0 to 1 for the overall extraction.
- Use only information that is visible or explicitly present. Never invent a
  brand, size, price or date. Return null instead.
- Do not wrap the JSON in markdown fences.`

let cachedProvider: ReturnType<typeof createOpenAI> | null = null

function getProvider(): ReturnType<typeof createOpenAI> {
    if (!cachedProvider) {
        const baseURL =
            process.env.OLLAMA_BASE_URL?.trim() || 'https://ollama.com/v1'
        const apiKey = process.env.OLLAMA_API_KEY?.trim()
        const isLocal =
            /localhost|127\.0\.0\.1|host\.docker\.internal/i.test(baseURL)

        if (!apiKey && !isLocal) {
            throw new DraftUnavailableError(
                'OLLAMA_API_KEY is not configured on the server.'
            )
        }

        cachedProvider = createOpenAI({
            baseURL,
            apiKey: apiKey || 'ollama',
        })
    }
    return cachedProvider
}

function modelFor(kind: 'text' | 'vision'): string | null {
    const value =
        kind === 'text'
            ? process.env.OLLAMA_TEXT_MODEL
            : process.env.OLLAMA_VISION_MODEL
    return value?.trim() || null
}

async function runModel(
    modelId: string,
    messages: ModelMessage[]
): Promise<ItemDraft> {
    const model = wrapLanguageModel({
        model: getProvider().chat(modelId),
        middleware: extractJsonMiddleware(),
    })

    try {
        const result = await generateText({
            model,
            output: Output.object({
                name: 'WardrobeItemDraft',
                description: 'Editable wardrobe item details',
                schema: ItemDraftSchema,
            }),
            messages,
            instructions: SYSTEM_PROMPT,
            temperature: 0.2,
        })
        if (!result.output) {
            throw new DraftError('The AI model did not return a draft.')
        }
        return normalizeDraft(result.output)
    } catch (error) {
        if (error instanceof DraftUnavailableError) throw error
        console.warn(
            'Structured output failed; retrying as plain text:',
            error
        )
    }

    try {
        const result = await generateText({
            model,
            messages,
            instructions: SYSTEM_PROMPT,
            temperature: 0.2,
        })
        return parseDraft(result.text)
    } catch (error) {
        if (error instanceof DraftUnavailableError) throw error
        console.error('Ollama item-draft request failed:', error)
        throw new DraftError(
            'The AI model could not produce a draft. Check the model configuration.'
        )
    }
}

function normalizeDraft(value: ItemDraft): ItemDraft {
    const record = { ...value } as Record<string, unknown>

    for (const key of [
        'brand',
        'category',
        'color',
        'size',
        'currency',
        'purchaseDate',
        'description',
    ]) {
        record[key] = nullableString(record[key])
    }
    record.price = nullablePrice(record.price)
    record.purchaseDate = nullableDate(record.purchaseDate)
    if (typeof record.confidence === 'string') {
        record.confidence = Number(record.confidence)
    }
    if (
        typeof record.itemName !== 'string' ||
        record.itemName.trim().toLowerCase() === 'null'
    ) {
        throw new DraftError('The AI model could not identify the item.')
    }

    const parsed = ItemDraftSchema.safeParse(record)
    if (!parsed.success) {
        throw new DraftError('The AI model returned an incomplete draft.')
    }
    return parsed.data
}

export async function draftFromImage(input: {
    imageBase64: string
    contentType: string
    hint?: string
}): Promise<DraftResult> {
    const model = modelFor('vision')
    if (!model) {
        throw new DraftUnavailableError(
            'Photo scanning is not configured. Set OLLAMA_VISION_MODEL to a vision-capable model.'
        )
    }

    const raw = input.imageBase64.trim()
    const base64 =
        raw.startsWith('data:') && raw.includes(',')
            ? (raw.split(',').pop() ?? '')
            : raw
    const buffer = Buffer.from(base64, 'base64')
    if (buffer.length === 0) {
        throw new DraftError('The selected photo is empty.')
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
        throw new DraftError('Photos must be smaller than 10 MB.')
    }

    const mediaType = input.contentType.startsWith('image/')
        ? input.contentType
        : 'image/jpeg'
    const hint = input.hint?.trim()
        ? `\nUser hint: ${input.hint.trim()}`
        : ''

    const draft = await runModel(model, [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `Identify the single garment in this photo and extract its details.${hint}`,
                },
                { type: 'image', image: base64, mediaType },
            ],
        },
    ])

    return { draft, photoPath: null, source: 'ai' }
}

export async function draftFromUrl(input: {
    url: string
    uid: string
}): Promise<DraftResult> {
    const page = await fetchProductPage(input.url)
    const photoPath = page.imageUrl
        ? await importImage(page.imageUrl, input.uid)
        : null

    const model = modelFor('text')
    if (!model) {
        return {
            draft: metadataDraft(page),
            photoPath,
            source: 'metadata',
        }
    }

    try {
        const draft = await runModel(model, [
            { role: 'user', content: pagePrompt(page) },
        ])
        return { draft, photoPath, source: 'ai' }
    } catch (error) {
        console.warn('URL item draft fell back to page metadata:', error)
        return {
            draft: metadataDraft(page),
            photoPath,
            source: 'metadata',
        }
    }
}

function pagePrompt(page: ProductPage): string {
    return [
        'Extract wardrobe item details from this product page.',
        `URL: ${page.url}`,
        `Product name: ${page.productName ?? 'unknown'}`,
        `Title: ${page.title ?? 'unknown'}`,
        `Brand: ${page.brand ?? 'unknown'}`,
        `Description: ${page.description ?? 'unknown'}`,
        `Color: ${page.color ?? 'unknown'}`,
        `Size: ${page.size ?? 'unknown'}`,
        `Site: ${page.siteName ?? 'unknown'}`,
        `Price: ${page.price ?? 'unknown'}`,
        `Currency: ${page.currency ?? 'unknown'}`,
        'Visible page text:',
        page.text,
    ].join('\n')
}

function metadataDraft(page: ProductPage): ItemDraft {
    const title = page.productName ?? cleanedTitle(page.title)
    const itemName =
        (title && title.slice(0, 120)) ||
        new URL(page.url).hostname.replace(/^www\./, '')

    return {
        itemName,
        brand: page.brand ?? page.siteName ?? null,
        category: null,
        color: page.color,
        size: page.size,
        price: page.price,
        currency: page.currency,
        purchaseDate: null,
        description: page.description ?? null,
        confidence: 0.3,
    }
}

function cleanedTitle(title: string | null): string | null {
    if (!title) return null
    return (
        title
            .replace(/^Buy\s+/i, '')
            .split('|')[0]
            .replace(/\s+/g, ' ')
            .trim() || null
    )
}

async function importImage(
    imageUrl: string,
    uid: string
): Promise<string | null> {
    try {
        const image = await fetchRemoteImage(imageUrl)
        return await uploadStoredPhotoBuffer({
            uid,
            buffer: image.buffer,
            contentType: image.contentType,
        })
    } catch (error) {
        console.warn('Could not import product image:', error)
        return null
    }
}

function parseDraft(raw: string): ItemDraft {
    const text = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end <= start) {
        throw new DraftError('The AI model did not return a JSON object.')
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(text.slice(start, end + 1))
    } catch {
        throw new DraftError('The AI model returned invalid JSON.')
    }
    if (!parsed || typeof parsed !== 'object') {
        throw new DraftError('The AI model returned an unexpected response.')
    }

    const record = parsed as Record<string, unknown>
    for (const key of [
        'brand',
        'category',
        'color',
        'size',
        'currency',
        'purchaseDate',
        'description',
    ]) {
        record[key] = nullableString(record[key])
    }
    record.price = nullablePrice(record.price)
    record.purchaseDate = nullableDate(record.purchaseDate)
    if (typeof record.confidence === 'string') {
        record.confidence = Number(record.confidence)
    }
    if (
        typeof record.itemName !== 'string' ||
        !record.itemName.trim() ||
        record.itemName.trim().toLowerCase() === 'null'
    ) {
        throw new DraftError('The AI model could not identify the item.')
    }

    const result = ItemDraftSchema.safeParse(record)
    if (!result.success) {
        throw new DraftError('The AI model returned an incomplete draft.')
    }
    return result.data
}

function nullableString(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    if (
        !trimmed ||
        ['null', 'n/a', 'na', 'unknown', 'not available'].includes(
            trimmed.toLowerCase()
        )
    ) {
        return null
    }
    return trimmed
}

function nullablePrice(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return value
    }
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(
            value.replace(/[^0-9.,-]/g, '').replace(/,/g, '')
        )
        if (Number.isFinite(parsed) && parsed >= 0) return parsed
    }
    return null
}

function nullableDate(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    if (!trimmed) return null
    const date = new Date(trimmed)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 10)
}
