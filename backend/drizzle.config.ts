import { defineConfig } from 'drizzle-kit'

/**
 * Point this at any Postgres to generate/apply migrations locally:
 *
 *   DATABASE_URL=postgresql://... npx drizzle-kit generate
 *
 * The runtime never uses drizzle-kit; the app only needs DATABASE_URL (or the
 * Cloud SQL connector variables) and the `pg` driver.
 */
export default defineConfig({
    schema: './src/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
})
