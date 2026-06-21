import { Hono } from 'hono'
import { requireAdmin } from '../shared/middleware/requireAdmin'

export const adminRouter = new Hono()

adminRouter.get('/users', requireAdmin, async (c) => {
  return c.json([])
})
