import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`);
        const createdAt = new Date().toISOString();
        console.log("Creating wardrobe with name:");
        const { userId, name, description } = await request.json(); // Assuming name and description are the fields for the wardrobe
        console.log("Creating wardrobe with name:", name);
        if (!userId || !name) {
            return Response.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const response = await sql`
            INSERT INTO wardrobes (
                user_id, 
                name, 
                description,
                created_at
            ) 
            VALUES (
                ${userId}, 
                ${name}, 
                ${description},
                ${createdAt}
            )
            RETURNING id;`; // Return the ID of the newly created wardrobe

        return new Response(JSON.stringify({ data: response }), {
            status: 201,
        });
    } catch (error) {
        console.error("Error creating wardrobe:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`);
        const { userId } = request.params;
        const response = await sql`
            SELECT * FROM wardrobes WHERE user_id = ${userId};`;

        return new Response(JSON.stringify({ data: response }), {
            status: 200,
        });
    } catch (error) {
        console.error("Error fetching wardrobes:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
