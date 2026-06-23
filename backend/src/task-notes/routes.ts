import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import type { AppEnv } from '../shared/auth'
import { requireAuth } from '../shared/middleware/requireAuth'
import { db } from '../shared/db'
import { taskNotes, tasks } from '../db/schema'
import { badRequest, notFound, forbidden, validationError } from '../shared/errors'

export const taskNotesRouter = new Hono<AppEnv>()

taskNotesRouter.use('*', requireAuth)

// GET /task-notes?taskId — notes scoped to task ownership
taskNotesRouter.get('/', async (c) => {
  const user = c.get('user')
  const taskIdParam = c.req.query('taskId')

  if (!taskIdParam) {
    return c.json(badRequest('taskId is required'), 400)
  }

  const taskId = parseInt(taskIdParam, 10)
  if (isNaN(taskId)) return c.json(badRequest('taskId must be a number'), 400)

  // Verify task ownership via tasks table
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))

  if (!task) {
    return c.json(notFound(), 404)
  }

  const rows = await db.select().from(taskNotes).where(eq(taskNotes.taskId, taskId))

  return c.json(rows)
})

// POST /task-notes — create a note (checks task ownership)
taskNotesRouter.post('/', async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ taskId: number; content: string }>()

  if (!body.taskId || !body.content) {
    return c.json(validationError({ taskId: 'required', content: 'required' }), 422)
  }

  // Verify task ownership
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, body.taskId), eq(tasks.userId, user.id)))

  if (!task) {
    return c.json(notFound(), 404)
  }

  const [inserted] = await db
    .insert(taskNotes)
    .values({ taskId: body.taskId, userId: user.id, content: body.content })
    .returning()

  return c.json(inserted, 201)
})

// DELETE /task-notes/:id — delete a note (ownership check via task)
taskNotesRouter.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json(badRequest('id must be a number'), 400)

  const [note] = await db.select().from(taskNotes).where(eq(taskNotes.id, id))

  if (!note) {
    return c.json(notFound(), 404)
  }

  // Verify ownership via tasks table join
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, note.taskId), eq(tasks.userId, user.id)))

  if (!task) {
    return c.json(forbidden(), 403)
  }

  await db.delete(taskNotes).where(eq(taskNotes.id, id))

  return c.json({ success: true })
})
