import { Hono } from 'hono'
import { eq, or, isNull } from 'drizzle-orm'
import type { AppEnv } from '../shared/auth'
import { requireAuth } from '../shared/middleware/require-auth'
import { db } from '../shared/db'
import { taskStatuses } from '../db/schema'
import { badRequest } from '../shared/errors'

export const taskStatusesRouter = new Hono<AppEnv>()

taskStatusesRouter.use('*', requireAuth)

// GET /task-statuses?categoryId= — returns global statuses plus category-specific ones
taskStatusesRouter.get('/', async (c) => {
  const categoryIdParam = c.req.query('categoryId')

  if (categoryIdParam !== undefined) {
    const categoryId = parseInt(categoryIdParam, 10)
    if (isNaN(categoryId)) return c.json(badRequest('categoryId must be a number'), 400)

    const rows = await db
      .select()
      .from(taskStatuses)
      .where(or(isNull(taskStatuses.categoryId), eq(taskStatuses.categoryId, categoryId)))

    return c.json(rows)
  }

  const rows = await db.select().from(taskStatuses)
  return c.json(rows)
})
