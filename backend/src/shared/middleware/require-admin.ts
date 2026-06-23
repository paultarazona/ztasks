import type { Context, Next } from 'hono'
import type { AppEnv } from '../auth'
import { eq } from 'drizzle-orm'
import { getSession } from '../auth'
import { unauthorized, forbidden } from '../errors'
import { getDb } from '../db'
import { adminUsers } from '../../db/schema/admin-users'

/**
 * Guards a route for admin-only access.
 * Validates the session, then checks the admin_users table for the user's ID.
 */
export async function requireAdmin(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const session = await getSession(c.req.raw)
  if (!session) {
    return c.json(unauthorized(), 401)
  }

  c.set('user', session.user)

  const db = getDb()
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.userId, session.user.id))
    .limit(1)

  if (rows.length === 0) {
    return c.json(forbidden(), 403)
  }

  return next()
}
