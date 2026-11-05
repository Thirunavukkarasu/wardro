import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'

import apiRoutes from './routes'

const app = new Hono()
const PORT = Number(process.env.PORT) || 3000

// Origins allowed to call the API from a browser (Expo web on 8081, Flutter
// web on 8080). Native clients ignore CORS entirely.
const browserOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'https://wardro--wardo-ce8d5.us-east4.hosted.app',
    ...(process.env.CORS_ORIGINS?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean) ?? []),
]

app.use(logger())
app.use(
    '/api/*',
    cors({
        // Echo the origin only when it is explicitly allowed; otherwise the
        // header is omitted and the browser blocks the response.
        origin: (origin) => (browserOrigins.includes(origin) ? origin : undefined),
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
    })
)
app.route('/api', apiRoutes)

serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`Server running at http://localhost:${info.port}`)
})
