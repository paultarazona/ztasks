import type { Context, Next } from 'hono'
import { requireAuth } from './requireAuth'
import { forbidden } from '../errors'

/**
 * Guards a route for admin-only access.
 * First enforces authentication via requireAuth, then checks admin status.
 *
 * TODO (Slice 3): Replace the placeholder 403 with a real admin_users table lookup
 * once the backend is wired to the production database.
 */
export async function requireAdmin(c: Context, next: Next): Promise<Response | void> {
  const authResult = await requireAuth(c, next)
  // If requireAuth returned a response (401), propagate it
  if (authResult instanceof Response) {
    return authResult
  }

  // TODO: Check admin_users table for the authenticated user's ID
  // For now, return 403 as a placeholder until real admin check is wired in Slice 3
  return c.json(forbidden(), 403)
}
