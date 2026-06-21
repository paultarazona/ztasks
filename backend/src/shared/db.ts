import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../db/schema/index'

// Lazy init: the pool is only created when first accessed.
// This prevents the module from throwing at import time if DATABASE_URL is absent
// (e.g., during unit tests that do not need a real DB connection).
let _db: ReturnType<typeof drizzle> | null = null

function getPool(): Pool {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set.')
  }
  return new Pool({ connectionString: url })
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema })
  }
  return _db
}

// Convenience re-export for callers that want a direct reference
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as Record<string | symbol, unknown>)[prop]
  },
})
