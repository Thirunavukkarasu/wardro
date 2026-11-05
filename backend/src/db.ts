import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import * as schema from '@/schema'

/**
 * Two connection modes, both plain Postgres:
 *
 * 1. `DATABASE_URL` — any Postgres (Neon, Supabase, RDS, local, ...). This is
 *    the portable path; switching providers is only a connection-string change.
 * 2. `CLOUD_SQL_CONNECTION_NAME` — Google Cloud SQL through its connector.
 *    Optional fallback; production currently uses `DATABASE_URL` (Neon).
 *    The code above the driver is identical.
 */
async function createPool(): Promise<Pool> {
    const max = Number(process.env.DATABASE_POOL_MAX ?? 5)

    if (process.env.DATABASE_URL) {
        return new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl:
                process.env.DATABASE_SSL === 'false'
                    ? false
                    : { rejectUnauthorized: false },
            max,
        })
    }

    if (process.env.CLOUD_SQL_CONNECTION_NAME) {
        const { Connector } = await import('@google-cloud/cloud-sql-connector')
        const connector = new Connector()
        const clientOpts = await connector.getOptions({
            instanceConnectionName: process.env.CLOUD_SQL_CONNECTION_NAME,
            ipType: 'PUBLIC',
        })

        return new Pool({
            ...clientOpts,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            max,
        })
    }

    throw new Error(
        'Set DATABASE_URL (any Postgres) or CLOUD_SQL_CONNECTION_NAME + DB_USER/DB_PASSWORD/DB_NAME'
    )
}

export const pool = await createPool()
export const db = drizzle(pool, { schema })
