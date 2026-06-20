import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../shared/middleware/requireAuth'
import { requireAdmin } from '../shared/middleware/requireAdmin'
import { db } from '../shared/db'
import { feedback } from '../db/schema'
import { badRequest, notFound } from '../shared/errors'
import { sseManager } from '../shared/sse'

export const feedbackRouter = new Hono()

// POST /feedback — authenticated user submits feedback
feedbackRouter.post('/', requireAuth, async (c) => {
  const user = c.get('user' as never) as { id: string }
  const body = await c.req.json<{ message: string }>()

  if (!body.message) {
    return c.json(badRequest('message is required'), 400)
  }

  const [inserted] = await db
    .insert(feedback)
    .values({ userId: user.id, message: body.message })
    .returning()

  sseManager.broadcast('feedback:admin', { type: 'feedback_created', payload: inserted })

  return c.json(inserted, 201)
})

// GET /feedback — admin only
feedbackRouter.get('/', requireAdmin, async (c) => {
  const rows = await db.select().from(feedback)
  return c.json(rows)
})

// PATCH /feedback/:id — admin only
feedbackRouter.patch('/:id', requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10)

  const [existing] = await db.select().from(feedback).where(eq(feedback.id, id))
  if (!existing) {
    return c.json(notFound(), 404)
  }

  const body = await c.req.json<Partial<typeof feedback.$inferInsert>>()
  const [updated] = await db
    .update(feedback)
    .set(body)
    .where(eq(feedback.id, id))
    .returning()

  return c.json(updated)
})

// DELETE /feedback/:id — admin only
feedbackRouter.delete('/:id', requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id'), 10)

  const [existing] = await db.select().from(feedback).where(eq(feedback.id, id))
  if (!existing) {
    return c.json(notFound(), 404)
  }

  await db.delete(feedback).where(eq(feedback.id, id))

  return c.json({ success: true })
})
