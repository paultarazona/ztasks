import { Hono } from 'hono'
import { requireAuth } from '../shared/middleware/requireAuth'

const NOT_IMPLEMENTED = { error: 'Not implemented', code: 'NOT_IMPLEMENTED' }

export const authRouter = new Hono()

// GET /auth/me — returns the authenticated user's profile fields
authRouter.get('/me', requireAuth, (c) => {
  const user = c.get('user' as never) as {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
  return c.json({ id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url })
})

// Stubs — BetterAuth handlers replace these in Slice 4
authRouter.get('/login', (c) => c.json(NOT_IMPLEMENTED, 501))
authRouter.post('/register', (c) => c.json(NOT_IMPLEMENTED, 501))
authRouter.post('/logout', (c) => c.json(NOT_IMPLEMENTED, 501))
