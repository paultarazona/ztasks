import { Hono } from 'hono'
import { auth } from '../shared/auth'
import { requireAuth } from '../shared/middleware/requireAuth'

const NOT_IMPLEMENTED = { error: 'Not implemented', code: 'NOT_IMPLEMENTED' }

export const authRouter = new Hono()

// GET /auth/me — returns the authenticated user's profile fields
authRouter.get('/me', requireAuth, (c) => {
  const user = c.get('user' as never) as {
    id: string
    email: string
    name: string
    image?: string | null
  }
  return c.json({ id: user.id, email: user.email, name: user.name, avatar_url: user.image ?? null })
})

// Legacy path stubs — BetterAuth uses /sign-in/email, /sign-up/email, /sign-out
authRouter.get('/login', (c) => c.json(NOT_IMPLEMENTED, 501))
authRouter.post('/register', (c) => c.json(NOT_IMPLEMENTED, 501))
authRouter.post('/logout', (c) => c.json(NOT_IMPLEMENTED, 501))

// BetterAuth handler — handles /sign-in/email, /sign-up/email, /sign-out, /get-session, etc.
authRouter.all('/*', (c) => auth.handler(c.req.raw))
