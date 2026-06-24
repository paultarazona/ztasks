import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import type { AppEnv } from '../shared/auth'
import { requireAuth } from '../shared/middleware/require-auth'
import { db } from '../shared/db'
import { categories } from '../db/schema'
import { badRequest, notFound, validationError } from '../shared/errors'

export const categoriesRouter = new Hono<AppEnv>()

categoriesRouter.use('*', requireAuth)

// GET /categories — active categories for the authenticated user
categoriesRouter.get('/', async (c) => {
  const user = c.get('user')
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, user.id), eq(categories.isDeleted, false)))
  return c.json(rows)
})

// GET /categories/trash — soft-deleted categories for the authenticated user
categoriesRouter.get('/trash', async (c) => {
  const user = c.get('user')
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, user.id), eq(categories.isDeleted, true)))
  return c.json(rows)
})

// POST /categories — create a new category
categoriesRouter.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    name: string
    color?: string
    type?: 'folder' | 'list'
    position?: number
    parentId?: number
  }>()

  if (!body.name) {
    return c.json(validationError({ name: 'required' }), 422)
  }

  const [inserted] = await db
    .insert(categories)
    .values({
      userId: user.id,
      name: body.name,
      color: body.color ?? null,
      type: body.type ?? 'list',
      position: body.position ?? null,
      parentId: body.parentId ?? null,
    })
    .returning()

  return c.json(inserted, 201)
})

// PATCH /categories/:id/restore — restore a soft-deleted category
categoriesRouter.patch('/:id/restore', async (c) => {
  const user = c.get('user')
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json(badRequest('id must be a number'), 400)

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))

  if (!existing) return c.json(notFound(), 404)

  const [updated] = await db
    .update(categories)
    .set({ isDeleted: false, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning()

  return c.json(updated)
})

// PATCH /categories/:id — update a category (ownership check enforced)
categoriesRouter.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json(badRequest('id must be a number'), 400)

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

// DELETE /categories/:id/permanent — permanently delete a category
categoriesRouter.delete('/:id/permanent', async (c) => {
  const user = c.get('user')
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json(badRequest('id must be a number'), 400)

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))

  if (!existing) return c.json(notFound(), 404)

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, user.id)))

  return c.json({ success: true })
})

// DELETE /categories/:id — soft delete (sets is_deleted = true)
categoriesRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json(badRequest('id must be a number'), 400)

  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))

  if (!existing) {
    return c.json(notFound(), 404)
  }

  const [updated] = await db
    .update(categories)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning()

  return c.json(updated)
})
