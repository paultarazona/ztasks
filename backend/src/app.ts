import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { notFound } from './shared/errors'
import { authRouter } from './auth/routes'
import { avatarRouter } from './auth/avatar'
import { resetRouter } from './auth/reset'
import { tasksRouter } from './tasks/routes'
import { categoriesRouter } from './categories/routes'
import { taskStatusesRouter } from './task-statuses/routes'
import { taskNotesRouter } from './task-notes/routes'
import { feedbackRouter } from './feedback/routes'
import { userProfilesRouter } from './user-profiles/routes'
import { docsRouter } from './docs/routes'
import { realtimeRouter } from './realtime/routes'

export function createApp() {
  const app = new Hono()

  app.use(cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }))

  app.get('/health', (c) => c.json({ status: 'ok' }))

  // Auth routes
  app.route('/auth', authRouter)
  app.route('/auth/avatar', avatarRouter)
  app.route('/auth/reset-password', resetRouter)

  // Domain routes
  app.route('/tasks', tasksRouter)
  app.route('/categories', categoriesRouter)
  app.route('/task-statuses', taskStatusesRouter)
  app.route('/task-notes', taskNotesRouter)
  app.route('/feedback', feedbackRouter)
  app.route('/user-profiles', userProfilesRouter)

  // Realtime SSE
  app.route('/realtime', realtimeRouter)

  // Docs
  app.route('/docs', docsRouter)

  // 404 fallback for all unmatched routes
  app.notFound((c) => c.json(notFound(), 404))

  return app
}
