import { Hono } from 'hono';
import userRoutes from '@/modules/users'
import wardrobeRoutes from '@/modules/wardrobes'
import wardrobeItemRoutes from '@/modules/wardrobeItems'

const apiRoutes = new Hono()

apiRoutes.get('/healthcheck', (c) => {
    return c.text('Server is running!')
})
apiRoutes.route('/users', userRoutes)
apiRoutes.route('/wardrobes', wardrobeRoutes)
apiRoutes.route('/wardrobesItems', wardrobeItemRoutes)

export default apiRoutes