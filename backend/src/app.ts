import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import type { AppEnv } from './shared/auth'
import { cors } from 'hono/cors'
import { notFound, internalError } from './shared/errors'
import { snakeCaseKeys } from './shared/snake'
import { authRouter } from './auth/routes'
import { avatarRouter } from './auth/avatar'
import { resetRouter } from './auth/reset'
import { tasksRouter } from './tasks/routes'
import { categoriesRouter } from './categories/routes'
import { taskStatusesRouter } from './task-statuses/routes'
import { taskNotesRouter } from './task-notes/routes'
import { feedbackRouter } from './feedback/routes'
import { userProfilesRouter } from './user-profiles/routes'
import { adminRouter } from './admin/routes'
import { docsRouter } from './docs/routes'
import { realtimeRouter } from './realtime/routes'

async function snakeCaseResponse(c: Context, next: Next) {
  await next()
  const ct = c.res.headers.get('content-type')
  if (!ct?.includes('application/json')) return
  try {
    const body = await c.res.clone().json()
    c.res = new Response(JSON.stringify(snakeCaseKeys(body)), {
      status: c.res.status,
      statusText: c.res.statusText,
      headers: new Headers(c.res.headers),
    })
  } catch {
    // streaming or non-JSON — leave as-is
  }
}

export function createApp() {
  const app = new Hono<AppEnv>()

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

  // Domain routes — register middleware for both root path and sub-paths
  for (const path of ['/tasks', '/categories', '/task-statuses', '/task-notes', '/feedback', '/user-profiles', '/admin']) {
    app.use(path, snakeCaseResponse)
    app.use(`${path}/*`, snakeCaseResponse)
  }

  app.route('/tasks', tasksRouter)
  app.route('/categories', categoriesRouter)
  app.route('/task-statuses', taskStatusesRouter)
  app.route('/task-notes', taskNotesRouter)
  app.route('/feedback', feedbackRouter)
  app.route('/user-profiles', userProfilesRouter)

  // Admin
  app.route('/admin', adminRouter)

  // Realtime SSE
  app.route('/realtime', realtimeRouter)

  // Docs
  app.route('/docs', docsRouter)

  app.onError((err, c) => {
    console.error(err)
    return c.json(internalError(), 500)
  })

  // 404 fallback for all unmatched routes
  app.notFound((c) => c.json(notFound(), 404))

  return app
}
