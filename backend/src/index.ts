import { Hono } from 'hono'
import { logger } from 'hono/logger'
import apiRoutes from './routes'

const app = new Hono()
const PORT = process.env.PORT || 3000

app.use(logger())
app.route('/api', apiRoutes)

Bun.serve({
    fetch: app.fetch,
    port: PORT
})

console.log(`Server running at http://localhost:${PORT}`)