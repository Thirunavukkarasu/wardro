import { Hono } from 'hono'
import {
    createWardrobe,
    deleteWardrobe,
    listWardrobeItemsByWardrobe,
    listWardrobes,
    listWardrobesWithItems,
} from '@wardro/dataconnect-admin'

import { WardrobeSchema } from '@/types'
import { dataConnect } from '@/dataConnect'
import { requireUser, type AuthEnv } from '@/auth'
import { removeStoredPhoto } from '@/storage'

const routes = new Hono<AuthEnv>()

// Every route below acts on the user named by the verified Firebase token.
routes.use('*', requireUser)

const options = (c: any) => ({
    impersonate: { authClaims: c.get('authClaims') },
})

routes.post('/', async (c) => {
    try {
        const wardrobe = WardrobeSchema.parse(await c.req.json())

        const { data } = await createWardrobe(
            dataConnect,
            {
                name: wardrobe.name,
                description: wardrobe.description ?? '',
            },
            options(c)
        )

        const created = {
            id: data.wardrobe_insert.id,
            userId: c.get('uid'),
            name: wardrobe.name,
            description: wardrobe.description ?? '',
            createdAt: new Date().toISOString(),
        }

        return Response.json({ data: [created] }, { status: 201 })
    } catch (error) {
        console.error('Error creating wardrobe:', error)
        return Response.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
})

routes.get('/summary', async (c) => {
    try {
        const { data } = await listWardrobesWithItems(dataConnect, options(c))

        const summary = data.wardrobes.map((wardrobe) => ({
            id: wardrobe.id,
            userId: wardrobe.ownerUid,
            name: wardrobe.name,
            description: wardrobe.description ?? '',
            createdAt: wardrobe.createdAt,
            itemCount: wardrobe.items.length,
            totalValue: wardrobe.items.reduce(
                (sum, item) => sum + (item.price ?? 0),
                0
            ),
            coverPhotoUri:
                wardrobe.items.find((item) => !!item.photoUri)?.photoUri ?? null,
        }))

        return Response.json({ data: summary }, { status: 200 })
    } catch (error) {
        console.error('Error fetching wardrobe summary:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

routes.get('/', async (c) => {
    try {
        const { data } = await listWardrobes(dataConnect, options(c))

        return Response.json(
            {
                data: data.wardrobes.map((wardrobe) => ({
                    ...wardrobe,
                    userId: wardrobe.ownerUid,
                })),
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching wardrobes:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

routes.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id') || '0')
        if (!id) {
            return Response.json({ error: 'Invalid wardrobe id' }, { status: 400 })
        }

        // Read the children before the cascade removes them so their photos can
        // be cleaned up from Storage.
        const items = await listWardrobeItemsByWardrobe(
            dataConnect,
            { wardrobeId: id },
            options(c)
        )

        const { data } = await deleteWardrobe(dataConnect, { id }, options(c))
        if (!data.wardrobe_delete) {
            return Response.json({ error: 'Wardrobe not found' }, { status: 404 })
        }

        await Promise.all(
            items.data.wardrobeItems.map((item) => removeStoredPhoto(item.photoUri))
        )

        return new Response(null, { status: 204 })
    } catch (error) {
        console.error('Error deleting wardrobe:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

export default routes
