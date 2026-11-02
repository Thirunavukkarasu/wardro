import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import apiRoutes from './routes'

const app = new Hono()
const PORT = process.env.PORT || 3000

// Origins allowed to call the API from a browser (the Flutter web dev server).
// Native clients (Expo/Flutter on device) ignore CORS entirely.
const browserOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    ...(process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []),
]

app.use(logger())
app.use(
    '/api/*',
    cors({
        // Echo the origin only when it is explicitly allowed; otherwise the
        // header is omitted and the browser blocks the response.
        origin: (origin) => (browserOrigins.includes(origin) ? origin : undefined),
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
        maxAge: 86400,
    })
)
app.route('/api', apiRoutes)

Bun.serve({
    fetch: app.fetch,
    port: PORT
})

console.log(`Server running at http://localhost:${PORT}`)