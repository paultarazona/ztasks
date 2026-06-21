import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from './db'

// Lazy singleton: betterAuth() is only called on first access so that
// unit tests which mock the db module don't trip over getDb() at import time.
let _auth: ReturnType<typeof betterAuth> | null = null

function getAuth(): ReturnType<typeof betterAuth> {
  if (!_auth) {
    _auth = betterAuth({
      database: drizzleAdapter(getDb(), { provider: 'pg' }),
      baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
      secret: process.env.BETTER_AUTH_SECRET,
      emailAndPassword: { enabled: true },
      trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:5173'],
    })
  }
  return _auth
}

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    return (getAuth() as Record<string | symbol, unknown>)[prop]
  },
})

export type Session = {
  session: { id: string; userId: string; expiresAt: Date; token: string }
  user: { id: string; email: string; name: string; emailVerified: boolean; image?: string | null }
}

export async function getSession(req: Request): Promise<Session | null> {
  return auth.api.getSession({ headers: req.headers }) as Promise<Session | null>
}
