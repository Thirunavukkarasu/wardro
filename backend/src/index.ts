import { Hono } from 'hono'
import { logger } from 'hono/logger'
import closetRoutes from '@/routes/closet'

const app = new Hono()
const PORT = process.env.PORT || 3000

app.use(logger())
app.get('/', (c) => {
    return c.text('Server is running!')
})
app.route('/closet', closetRoutes)

Bun.serve({
    fetch: app.fetch,
    port: PORT
})

console.log(`Server running at http://localhost:${PORT}`)