import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../shared/middleware/requireAuth'
import { db } from '../shared/db'
import { categories } from '../db/schema'
import { badRequest, notFound } from '../shared/errors'

export const categoriesRouter = new Hono()

categoriesRouter.use('*', requireAuth)

// GET /categories — all categories for the authenticated user
categoriesRouter.get('/', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const rows = await db.select().from(categories).where(eq(categories.userId, user.id))
  return c.json(rows)
})

// POST /categories — create a new category
categoriesRouter.post('/', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const body = await c.req.json<{
    name: string
    color?: string
    position?: number
  }>()

  if (!body.name) {
    return c.json(badRequest('name is required'), 400)
  }

  const [inserted] = await db
    .insert(categories)
    .values({
      userId: user.id,
      name: body.name,
      color: body.color ?? null,
      position: body.position ?? null,
    })
    .returning()

  return c.json(inserted, 201)
})

// PATCH /categories/:id — update a category (ownership check enforced)
categoriesRouter.patch('/:id', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const id = parseInt(c.req.param('id'), 10)

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))

  if (!existing) {
    return c.json(notFound(), 404)
  }

  const body = await c.req.json<Partial<typeof categories.$inferInsert>>()

  const [updated] = await db
    .update(categories)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning()

  return c.json(updated)
})

// DELETE /categories/:id — soft delete (ownership check enforced)
categoriesRouter.delete('/:id', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const id = parseInt(c.req.param('id'), 10)

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))

  if (!existing) {
    return c.json(notFound(), 404)
  }

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, user.id)))

  return c.json({ success: true })
})
