import { Hono } from 'hono'
import { eq } from "drizzle-orm";

import { UserSchema, type User } from '@/types';
import { db } from '@/db';
import { usersTable } from '@/schema';

const routes = new Hono()

routes.post('/', async (c) => {
    try {
        const requestData = await c.req.json();
        const user: User = UserSchema.parse(requestData);

        const response = await db.insert(usersTable).values(user);
        return new Response(JSON.stringify({ data: response }), {
            status: 201,
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
})

routes.get('/', async (c) => {
    try {
        const clerkId: string = c.req.param('clerkId') || '';
        const response = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
        return new Response(JSON.stringify({ data: response }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
})

export default routes


