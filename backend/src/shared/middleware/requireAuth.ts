import type { Context, Next } from 'hono'
import { unauthorized } from '../errors'

/**
 * Reads the `user` variable set by BetterAuth session middleware (wired in Slice 3).
 * Returns 401 if the request has no authenticated user.
 *
 * Stub: BetterAuth session injection is added in Slice 3.
 */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const user = c.get('user' as never)
  if (!user) {
    return c.json(unauthorized(), 401)
  }
  return next()
}
