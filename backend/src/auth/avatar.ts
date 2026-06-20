import { Hono } from 'hono'
import { requireAuth } from '../shared/middleware/requireAuth'

export const avatarRouter = new Hono()

// POST /avatar — real multipart upload is Slice 4
avatarRouter.post('/', requireAuth, (c) =>
  c.json({ error: 'Not implemented', code: 'NOT_IMPLEMENTED' }, 501)
)
