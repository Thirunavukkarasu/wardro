import { eq } from "drizzle-orm";
import { Hono } from 'hono'

import { db } from '@/db';
import { usersTable } from '@/schema';
import { requireUser, type AuthEnv } from '@/auth';

const routes = new Hono<AuthEnv>()

routes.use('*', requireUser)

// The user row is created on first authenticated request by `requireUser`.
routes.get('/me', async (c) => {
    const rows = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, c.get('userId')));

    if (rows.length === 0) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ data: rows }, { status: 200 });
})

export default routes
