import { Hono } from 'hono'

const closetRoutes = new Hono()

closetRoutes.get('/', (c) => {
    return c.text('Hello Closet!')
})

export default closetRoutes