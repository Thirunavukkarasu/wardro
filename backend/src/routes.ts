import { Hono } from 'hono';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'

import userRoutes from '@/modules/users'
import wardrobeRoutes from '@/modules/wardrobes'
import wardrobeItemRoutes from '@/modules/wardrobeItems'

const apiRoutes = new Hono()

apiRoutes.use('*', clerkMiddleware())

apiRoutes.get('/healthcheck', (c) => {
    // const auth = getAuth(c);
    // if (!auth?.userId) {
    //     return c.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // console.log('Auth:', auth)
    return c.text('Server is running!')
})

apiRoutes.route('/users', userRoutes)
apiRoutes.route('/wardrobes', wardrobeRoutes)
apiRoutes.route('/wardrobesItems', wardrobeItemRoutes)

export default apiRoutes