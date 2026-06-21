import type { Context, Next } from 'hono'
import { getSession } from '../auth'
import { unauthorized } from '../errors'

/**
 * Validates the BetterAuth session from the incoming request.
 * Sets `user` on the Hono context and calls next() when authenticated.
 * Returns 401 when no valid session is present.
 */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const session = await getSession(c.req.raw)
  if (!session) {
    return c.json(unauthorized(), 401)
  }
  c.set('user' as never, session.user)
  return next()
}
