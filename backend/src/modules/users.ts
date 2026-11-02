import { Hono } from 'hono'
import { getMe } from '@wardro/dataconnect-admin'

import { dataConnect } from '@/dataConnect'
import { requireUser, type AuthEnv } from '@/auth'

const routes = new Hono<AuthEnv>()

routes.use('*', requireUser)

routes.get('/me', async (c) => {
    try {
        const { data } = await getMe(dataConnect, {
            impersonate: { authClaims: c.get('authClaims') },
        })

        return Response.json(
            { data: data.user ? [data.user] : [] },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching user:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

export default routes
