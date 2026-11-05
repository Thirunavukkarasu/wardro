#!/usr/bin/env bun
/**
 * Seed the four-profile simulation dataset.
 *
 * Usage:
 *   cd backend
 *   DEMO_BASE_URL=http://localhost:3000/demo bun run seed:demo
 *   bun run seed:demo:dry
 *
 * The script is additive and idempotent. It reuses the account's existing
 * default profile as Tiru when that profile is still the only profile or is
 * named after the account holder. It never deletes rows.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const here = path.dirname(fileURLToPath(import.meta.url))
const manifestPath = path.resolve(
    here,
    '../../datasets/wardrobe-simulation/manifest.json'
)
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

const baseUrl = (
    process.env.DEMO_BASE_URL ?? 'http://localhost:3000/demo'
).replace(/\/+$/, '')
const dryRun =
    process.argv.includes('--dry-run') || process.env.DRY_RUN === '1'

if (!process.env.DATABASE_URL) {
    console.error(
        'This script expects DATABASE_URL (a local Postgres or Neon URL). ' +
            'The Cloud SQL connector path is not supported by the seeder.'
    )
    process.exit(1)
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
        process.env.DATABASE_SSL === 'false'
            ? false
            : { rejectUnauthorized: false },
    max: 2,
})

const client = await pool.connect()

function log(...args) {
    console.log(...args)
}

async function columnsFor(table) {
    const { rows } = await client.query(
        `select column_name
           from information_schema.columns
          where table_schema = current_schema()
            and table_name = $1`,
        [table]
    )
    return new Set(rows.map((row) => row.column_name))
}

function placeholders(count, offset = 0) {
    return Array.from(
        { length: count },
        (_, index) => `$${index + 1 + offset}`
    ).join(', ')
}

async function findOrCreateProfile(profile, existingProfiles, profileCols) {
    const byName = new Map(existingProfiles.map((row) => [row.name, row]))
    let row = byName.get(profile.name)

    if (!row) {
        const isFirst = existingProfiles.length === 0
        const hasDefault = existingProfiles.some((row) => row.is_default)
        const cols = ['owner_uid', 'name', 'color', 'is_default']
        const values = [
            ownerUid,
            profile.name,
            profile.color,
            isFirst || (profile.key === 'tiru' && !hasDefault),
        ]
        if (profileCols.has('relationship')) {
            cols.push('relationship')
            values.push(profile.relationship ?? 'other')
        }
        if (profileCols.has('profile_type')) {
            cols.push('profile_type')
            values.push(profile.profileType ?? 'adult')
        }
        if (profileCols.has('age_group')) {
            cols.push('age_group')
            values.push(profile.ageGroup ?? null)
        }
        const { rows } = await client.query(
            `insert into profile (${cols.join(', ')})
             values (${placeholders(cols.length)})
             returning *`,
            values
        )
        row = rows[0]
        existingProfiles.push(row)
        log(`  + profile ${profile.name} (id ${row.id})`)
    } else {
        const sets = []
        const values = []
        if (row.color !== profile.color) {
            values.push(profile.color)
            sets.push(`color = $${values.length}`)
        }
        if (
            profileCols.has('relationship') &&
            row.relationship !== profile.relationship
        ) {
            values.push(profile.relationship ?? 'other')
            sets.push(`relationship = $${values.length}`)
        }
        if (
            profileCols.has('profile_type') &&
            row.profile_type !== profile.profileType
        ) {
            values.push(profile.profileType ?? 'adult')
            sets.push(`profile_type = $${values.length}`)
        }
        if (
            profileCols.has('age_group') &&
            row.age_group !== (profile.ageGroup ?? null)
        ) {
            values.push(profile.ageGroup ?? null)
            sets.push(`age_group = $${values.length}`)
        }
        if (sets.length) {
            values.push(row.id)
            const { rows } = await client.query(
                `update profile
                    set ${sets.join(', ')}, updated_at = now()
                  where id = $${values.length}
                  returning *`,
                values
            )
            row = rows[0]
            log(`  ~ profile ${profile.name} (id ${row.id}) updated`)
        } else {
            log(`  = profile ${profile.name} (id ${row.id})`)
        }
    }

    byName.set(row.name, row)
    return row
}

async function findOrCreateWardrobe(profileRow, wardrobe, wardrobeCols) {
    const found = await client.query(
        `select * from wardrobe
          where owner_uid = $1 and profile_id = $2 and name = $3
          limit 1`,
        [ownerUid, profileRow.id, wardrobe.name]
    )
    if (found.rows[0]) {
        const row = found.rows[0]
        const sets = []
        const values = []
        if ((row.description ?? '') !== (wardrobe.description ?? '')) {
            values.push(wardrobe.description ?? '')
            sets.push(`description = $${values.length}`)
        }
        if (wardrobeCols.has('type') && row.type !== (wardrobe.type ?? null)) {
            values.push(wardrobe.type ?? null)
            sets.push(`type = $${values.length}`)
        }
        if (sets.length) {
            values.push(row.id)
            await client.query(
                `update wardrobe
                    set ${sets.join(', ')}
                  where id = $${values.length}`,
                values
            )
            log(`    ~ wardrobe ${wardrobe.name} (id ${row.id})`)
        } else {
            log(`    = wardrobe ${wardrobe.name} (id ${row.id})`)
        }
        return row
    }

    const cols = ['owner_uid', 'profile_id', 'name', 'description']
    const values = [
        ownerUid,
        profileRow.id,
        wardrobe.name,
        wardrobe.description ?? '',
    ]
    if (wardrobeCols.has('type')) {
        cols.push('type')
        values.push(wardrobe.type ?? null)
    }
    const { rows } = await client.query(
        `insert into wardrobe (${cols.join(', ')})
         values (${placeholders(cols.length)})
         returning *`,
        values
    )
    log(`    + wardrobe ${wardrobe.name} (id ${rows[0].id})`)
    return rows[0]
}

async function ensureItem(profileRow, wardrobeRow, item, itemCols) {
    const found = await client.query(
        `select id from wardrobe_item
          where owner_uid = $1 and profile_id = $2
            and wardrobe_id = $3 and item_name = $4
          limit 1`,
        [ownerUid, profileRow.id, wardrobeRow.id, item.itemName]
    )
    if (found.rows[0]) {
        log(`      = item ${item.itemName} (id ${found.rows[0].id})`)
        return { inserted: false, id: found.rows[0].id }
    }

    const cols = [
        'owner_uid',
        'profile_id',
        'wardrobe_id',
        'photo_uri',
        'item_name',
        'price',
        'brand',
        'category',
        'color',
        'size',
        'state',
    ]
    const values = [
        ownerUid,
        profileRow.id,
        wardrobeRow.id,
        `${baseUrl}/${item.image}`,
        item.itemName,
        item.price ?? null,
        item.brand ?? null,
        item.category ?? null,
        item.color ?? null,
        item.size ?? null,
        item.state ?? 'in_use',
    ]

    const optionalText = [
        ['subcategory', 'subcategory'],
        ['material', 'material'],
        ['pattern', 'pattern'],
        ['fit', 'fit'],
        ['sleeve_length', 'sleeve'],
    ]
    for (const [column, key] of optionalText) {
        if (itemCols.has(column)) {
            cols.push(column)
            values.push(item[key] ?? null)
        }
    }

    const optionalJson = [
        ['seasons', 'seasons'],
        ['occasions', 'occasions'],
        ['style_tags', 'styleTags'],
    ]
    for (const [column, key] of optionalJson) {
        if (itemCols.has(column)) {
            cols.push(column)
            values.push(JSON.stringify(item[key] ?? []))
        }
    }

    if (itemCols.has('updated_at')) {
        cols.push('updated_at')
        values.push(new Date())
    }

    // JSONB columns need an explicit cast when the parameter is a string.
    const valueExprs = cols.map((column, index) => {
        const base = `$${index + 1}`
        return itemCols.has(column) &&
            ['seasons', 'occasions', 'style_tags'].includes(column)
            ? `${base}::jsonb`
            : base
    })

    const { rows } = await client.query(
        `insert into wardrobe_item (${cols.join(', ')})
         values (${valueExprs.join(', ')})
         returning id`,
        values
    )
    log(`      + item ${item.itemName} (id ${rows[0].id})`)
    return { inserted: true, id: rows[0].id }
}

let ownerUid
try {
    const ownerQuery = process.env.DEMO_OWNER_UID
        ? {
              text: `select uid, display_name from "user" where uid = $1`,
              values: [process.env.DEMO_OWNER_UID],
          }
        : {
              text: `select u.uid, u.display_name,
                            (select count(*)::int from wardrobe w
                              where w.owner_uid = u.uid) as wardrobe_count
                       from "user" u
                      order by wardrobe_count desc, u.created_at asc
                      limit 1`,
              values: [],
          }
    const ownerResult = await client.query(ownerQuery)
    const owner = ownerResult.rows[0]
    if (!owner) {
        throw new Error(
            'No user row found. Sign in to the app once, then rerun the seed.'
        )
    }
    ownerUid = owner.uid
    log(
        `Owner: ${owner.display_name ?? '(no display name)'} <${owner.uid}>` +
            (process.env.DEMO_OWNER_UID ? ' (explicit DEMO_OWNER_UID)' : '')
    )

    await client.query('begin')

    const profileCols = await columnsFor('profile')
    const wardrobeCols = await columnsFor('wardrobe')
    const itemCols = await columnsFor('wardrobe_item')

    const profileResult = await client.query(
        'select * from profile where owner_uid = $1 order by created_at asc',
        [ownerUid]
    )
    const profiles = profileResult.rows
    log(`Existing profiles: ${profiles.length}`)

    // Reuse the original default profile as Tiru when it is still the only
    // profile or is named after the account holder. This keeps the household
    // at exactly four demo profiles instead of adding a fifth.
    const defaultProfile = profiles.find((row) => row.is_default)
    const tiruSpec = manifest.profiles.find((profile) => profile.key === 'tiru')
    let tiru = profiles.find((row) => row.name === 'Tiru')
    if (!tiru && defaultProfile) {
        const shouldRename =
            profiles.length === 1 || defaultProfile.name === owner.display_name
        if (shouldRename) {
            const sets = ['name = $1', 'color = $2']
            const values = [tiruSpec.name, tiruSpec.color]
            if (profileCols.has('relationship')) {
                values.push(tiruSpec.relationship ?? 'self')
                sets.push(`relationship = $${values.length}`)
            }
            if (profileCols.has('profile_type')) {
                values.push(tiruSpec.profileType ?? 'adult')
                sets.push(`profile_type = $${values.length}`)
            }
            if (profileCols.has('age_group')) {
                values.push(tiruSpec.ageGroup ?? null)
                sets.push(`age_group = $${values.length}`)
            }
            values.push(defaultProfile.id)
            const { rows } = await client.query(
                `update profile
                    set ${sets.join(', ')}, updated_at = now()
                  where id = $${values.length}
                  returning *`,
                values
            )
            tiru = rows[0]
            log(
                `  ~ renamed default profile "${defaultProfile.name}" -> "Tiru" ` +
                    `(id ${tiru.id})`
            )
        }
    }
    if (!tiru) {
        tiru = await findOrCreateProfile(tiruSpec, profiles, profileCols)
    } else {
        log(`  = profile Tiru (id ${tiru.id})`)
    }

    const profileRows = new Map([[tiru.name, tiru]])
    for (const profileSpec of manifest.profiles) {
        if (profileSpec.key === 'tiru') continue
        const row = await findOrCreateProfile(
            profileSpec,
            profiles,
            profileCols
        )
        profileRows.set(profileSpec.name, row)
    }

    const swati = profileRows.get('Swati')
    const oldSwatiWardrobes = (
        await client.query(
            `select * from wardrobe
              where owner_uid = $1 and profile_id = $2`,
            [ownerUid, tiru.id]
        )
    ).rows.filter((row) => {
        const normalized = row.name.toLowerCase().replace(/[’']/g, "'")
        return normalized === "swati's" || normalized === 'swatis'
    })

    for (const oldWardrobe of oldSwatiWardrobes) {
        const duplicate = await client.query(
            `select id from wardrobe
              where owner_uid = $1 and profile_id = $2 and name = $3
              limit 1`,
            [ownerUid, swati.id, oldWardrobe.name]
        )
        if (duplicate.rows[0]) {
            log(
                `  ! wardrobe "${oldWardrobe.name}" already exists for Swati; ` +
                    'leaving the Tiru copy in place'
            )
            continue
        }
        await client.query(
            `update wardrobe set profile_id = $1 where id = $2`,
            [swati.id, oldWardrobe.id]
        )
        await client.query(
            `update wardrobe_item set profile_id = $1 where wardrobe_id = $2`,
            [swati.id, oldWardrobe.id]
        )
        log(
            `  ~ moved wardrobe "${oldWardrobe.name}" (id ${oldWardrobe.id}) ` +
                'from Tiru to Swati'
        )
    }

    let insertedItems = 0
    let skippedItems = 0
    for (const profileSpec of manifest.profiles) {
        const profileRow = profileRows.get(profileSpec.name)
        log(`\n${profileSpec.name} (profile ${profileRow.id})`)
        for (const wardrobeSpec of profileSpec.wardrobes) {
            const wardrobeRow = await findOrCreateWardrobe(
                profileRow,
                wardrobeSpec,
                wardrobeCols
            )
            for (const item of wardrobeSpec.items) {
                const result = await ensureItem(
                    profileRow,
                    wardrobeRow,
                    item,
                    itemCols
                )
                if (result.inserted) insertedItems += 1
                else skippedItems += 1
            }
        }
    }

    const counts = await client.query(
        `select
            (select count(*)::int from profile where owner_uid = $1) as profiles,
            (select count(*)::int from wardrobe where owner_uid = $1) as wardrobes,
            (select count(*)::int from wardrobe_item where owner_uid = $1) as items`,
        [ownerUid]
    )

    if (dryRun) {
        await client.query('rollback')
        log('\nDRY RUN — transaction rolled back; no changes were saved.')
    } else {
        await client.query('commit')
        log('\nCommitted.')
    }

    log(
        `Inserted ${insertedItems} items, skipped ${skippedItems} existing. ` +
            `Account totals: ${counts.rows[0].profiles} profiles, ` +
            `${counts.rows[0].wardrobes} wardrobes, ${counts.rows[0].items} items.`
    )
    log(`Photo base URL: ${baseUrl}`)
    if (baseUrl.includes('localhost')) {
        log(
            'Note: localhost works for the web app. Use 10.0.2.2 for the ' +
                'Android emulator or your LAN IP for a physical device.'
        )
    }
} catch (error) {
    try {
        await client.query('rollback')
    } catch {
        // Ignore rollback errors; the original error is more useful.
    }
    console.error('\nSeed failed:', error)
    process.exitCode = 1
} finally {
    client.release()
    await pool.end()
}
