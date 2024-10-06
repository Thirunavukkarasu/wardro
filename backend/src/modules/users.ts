import { Hono } from 'hono'
import { eq } from "drizzle-orm";

import { UserSchema, type User } from '@/types';
import { db } from '@/db';
import { usersTable } from '@/schema';

const routes = new Hono()

routes.post('/', async (c) => {
    try {
        const requestData = await c.req.json();
        console.log("Request data:", requestData);
        const user: User = UserSchema.parse(requestData);

        const response = await db.insert(usersTable).values(user).returning();
        return new Response(JSON.stringify({ data: response }), {
            status: 201,
        });
    } catch (error) {
        console.error("Error creating user:", error);
        const errorMessage = (error as any).message;
        return Response.json({ error: errorMessage }, { status: 500 });
    }
})

routes.get('/:clerkId', async (c) => {
    try {
        const clerkId: string = c.req.param('clerkId') || '';
        const response = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
        return new Response(JSON.stringify({ data: response }), {
            status: 200,
        });
    } catch (error: any) {
        console.error("Error creating user:", error);
        const errorMessage = (error as any).message;
        return Response.json({ error: errorMessage }, { status: 500 });
    }
})

export default routes


