import { Hono } from 'hono'
import { z } from 'zod'
import {
    createWardrobeItem,
    deleteWardrobeItem,
    getWardrobe,
    getWardrobeItem,
    listWardrobeItems,
    listWardrobeItemsByWardrobe,
} from '@wardro/dataconnect-admin'

import { WardrobeItemSchema } from '@/types'
import { dataConnect } from '@/dataConnect'
import { requireUser, type AuthEnv } from '@/auth'
import { removeStoredPhoto } from '@/storage'

const routes = new Hono<AuthEnv>()

routes.use('*', requireUser)

const options = (c: any) => ({
    impersonate: { authClaims: c.get('authClaims') },
})

const withUserId = <T extends { ownerUid: string }>(row: T) => ({
    ...row,
    userId: row.ownerUid,
})

routes.post('/', async (c) => {
    try {
        const item = WardrobeItemSchema.parse(await c.req.json())

        const { data } = await createWardrobeItem(
            dataConnect,
            {
                itemName: item.itemName,
                wardrobeId: item.wardrobeId,
                photoUri: item.photoUri,
                purchaseDate: item.purchaseDate,
                expiryDate: item.expiryDate,
                price: item.price,
                brand: item.brand,
                category: item.category,
                color: item.color,
                size: item.size,
            },
            options(c)
        )

        return Response.json(
            {
                data: [
                    {
                        ...item,
                        id: data.wardrobeItem_insert.id,
                        userId: c.get('uid'),
                        createdAt: new Date().toISOString(),
                    },
                ],
            },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Error creating wardrobe item:', error)

        if (error instanceof z.ZodError) {
            return Response.json({ error: error.errors }, { status: 400 })
        }
        if (String(error?.message ?? '').includes('Wardrobe not found')) {
            return Response.json({ error: 'Wardrobe not found' }, { status: 404 })
        }

        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

// Every item belonging to the authenticated user, newest first.
routes.get('/', async (c) => {
    const { data } = await listWardrobeItems(dataConnect, options(c))

    return Response.json(
        { data: data.wardrobeItems.map(withUserId) },
        { status: 200 }
    )
})

routes.get('/:wardrobeId', async (c) => {
    const wardrobeId = parseInt(c.req.param('wardrobeId') || '0')
    if (!wardrobeId) {
        return Response.json({ error: 'Invalid wardrobeId' }, { status: 400 })
    }

    const { data: wardrobe } = await getWardrobe(
        dataConnect,
        { id: wardrobeId },
        options(c)
    )
    if (!wardrobe.wardrobe) {
        return Response.json({ error: 'Wardrobe not found' }, { status: 404 })
    }

    const { data } = await listWardrobeItemsByWardrobe(
        dataConnect,
        { wardrobeId },
        options(c)
    )

    return Response.json(
        { data: data.wardrobeItems.map(withUserId) },
        { status: 200 }
    )
})

routes.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0')
        if (!id) {
            return Response.json({ error: 'Invalid item id' }, { status: 400 })
        }

        const { data: found } = await getWardrobeItem(dataConnect, { id }, options(c))
        if (!found.wardrobeItem) {
            return Response.json({ error: 'Item not found' }, { status: 404 })
        }

        await deleteWardrobeItem(dataConnect, { id }, options(c))
        await removeStoredPhoto(found.wardrobeItem.photoUri)

        return new Response(null, { status: 204 })
    } catch (error: any) {
        console.error('Error deleting wardrobe item:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

export default routes
