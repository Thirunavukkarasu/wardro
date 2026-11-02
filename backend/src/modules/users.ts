import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '@/db'
import { users } from '@/schema'
import { requireUser, type AuthEnv } from '@/auth'

const routes = new Hono<AuthEnv>()

routes.use('*', requireUser)

routes.get('/me', async (c) => {
    try {
        const rows = await db
            .select()
            .from(users)
            .where(eq(users.uid, c.get('uid')))

        return Response.json({ data: rows }, { status: 200 })
    } catch (error) {
        console.error('Error fetching user:', error)
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }
})

export default routes
