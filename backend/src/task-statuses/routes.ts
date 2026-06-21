import { Hono } from 'hono'
import { requireAuth } from '../shared/middleware/requireAuth'
import { db } from '../shared/db'
import { taskStatuses } from '../db/schema'

export const taskStatusesRouter = new Hono()

taskStatusesRouter.use('*', requireAuth)

// GET /task-statuses — returns all global statuses (no user filter)
taskStatusesRouter.get('/', async (c) => {
  const rows = await db.select().from(taskStatuses)
  return c.json(rows)
})
