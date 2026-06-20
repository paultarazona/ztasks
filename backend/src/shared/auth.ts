/**
 * Auth stub — Slice 2 scaffold only.
 *
 * TODO (Slice 3): Replace with real BetterAuth init:
 *   import { betterAuth } from 'better-auth'
 *   export const auth = betterAuth({ ... })
 *
 * getSession is a stub that always returns null until BetterAuth is wired
 * to the real database in Slice 3.
 */

export type Session = {
  user: { id: string; email: string }
}

// Placeholder — replaced in Slice 3 with real BetterAuth instance
export const auth = null as unknown as { handler: (req: Request) => Promise<Response> }

/**
 * Returns the current session from the request, or null if not authenticated.
 * Stub: always returns null until BetterAuth is initialized in Slice 3.
 */
export async function getSession(_req: Request): Promise<Session | null> {
  // TODO (Slice 3): return auth.api.getSession({ headers: _req.headers })
  return null
}
