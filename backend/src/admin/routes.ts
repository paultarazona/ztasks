import { Hono } from 'hono'
import type { AppEnv } from '../shared/auth'
import { requireAdmin } from '../shared/middleware/require-admin'

export const adminRouter = new Hono<AppEnv>()

adminRouter.get('/users', requireAdmin, async (c) => {
  return c.json([])
})
