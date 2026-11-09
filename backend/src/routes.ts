import { Hono } from 'hono'

import photoRoutes from '@/modules/photos'
import profileRoutes from '@/modules/profiles'
import userRoutes from '@/modules/users'
import wardrobeRoutes from '@/modules/wardrobes'
import wardrobeItemRoutes from '@/modules/wardrobeItems'

const apiRoutes = new Hono()

apiRoutes.get('/healthcheck', (c) => {
    return c.text('Server is running!')
})

apiRoutes.route('/photos', photoRoutes)
apiRoutes.route('/profiles', profileRoutes)
apiRoutes.route('/users', userRoutes)
apiRoutes.route('/wardrobes', wardrobeRoutes)
apiRoutes.route('/wardrobeItems', wardrobeItemRoutes)

export default apiRoutes
