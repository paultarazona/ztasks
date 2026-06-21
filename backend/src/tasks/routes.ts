import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../shared/middleware/requireAuth'
import { db } from '../shared/db'
import { tasks } from '../db/schema'
import { sseManager } from '../shared/sse'
import { badRequest, notFound } from '../shared/errors'

export const tasksRouter = new Hono()

tasksRouter.use('*', requireAuth)

// GET /tasks?categoryId — scoped to authenticated user and optional category
tasksRouter.get('/', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const categoryIdParam = c.req.query('categoryId')

  let rows: typeof tasks.$inferSelect[]
  if (categoryIdParam) {
    const categoryId = parseInt(categoryIdParam, 10)
    rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.categoryId, categoryId)))
  } else {
    rows = await db.select().from(tasks).where(eq(tasks.userId, user.id))
  }

  return c.json(rows)
})

// POST /tasks — create a new task and broadcast SSE event
tasksRouter.post('/', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const body = await c.req.json<{
    title: string
    categoryId?: number
    description?: string
    statusId?: number
    position?: number
    dueDate?: string
  }>()

  if (!body.title) {
    return c.json(badRequest('title is required'), 400)
  }

  const [inserted] = await db
    .insert(tasks)
    .values({
      userId: user.id,
      title: body.title,
      categoryId: body.categoryId ?? null,
      description: body.description ?? null,
      statusId: body.statusId ?? null,
      position: body.position ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    })
    .returning()

  const categoryId = inserted.categoryId
  sseManager.broadcast(`tasks:${user.id}:${categoryId}`, {
    type: 'task_created',
    payload: inserted,
  })

  return c.json(inserted, 201)
})

// PATCH /tasks/:id — update a task (ownership check enforced)
tasksRouter.patch('/:id', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const id = parseInt(c.req.param('id'), 10)

  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))

  if (!existing) {
    return c.json(notFound(), 404)
  }

  const body = await c.req.json<Partial<typeof tasks.$inferInsert>>()

  const [updated] = await db
    .update(tasks)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning()

  sseManager.broadcast(`tasks:${user.id}:${updated.categoryId}`, {
    type: 'task_updated',
    payload: updated,
  })

  return c.json(updated)
})

// DELETE /tasks/:id — delete a task (ownership check enforced)
tasksRouter.delete('/:id', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const id = parseInt(c.req.param('id'), 10)

  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))

  if (!existing) {
    return c.json(notFound(), 404)
  }

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))

  sseManager.broadcast(`tasks:${user.id}:${existing.categoryId}`, {
    type: 'task_deleted',
    payload: { id },
  })

  return c.json({ success: true })
})

// PATCH /tasks/:id/reorder — update position field
tasksRouter.patch('/:id/reorder', async (c) => {
  const user = c.get('user' as never) as { id: string }
  const id = parseInt(c.req.param('id'), 10)
  const body = await c.req.json<{ position: number }>()

  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))

  if (!existing) {
    return c.json(notFound(), 404)
  }

  const [updated] = await db
    .update(tasks)
    .set({ position: body.position, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning()

  return c.json(updated)
})
