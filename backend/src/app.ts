import { Hono } from 'hono'
import { notFound } from './shared/errors'

export function createApp() {
  const app = new Hono()

  app.get('/health', (c) => c.json({ status: 'ok' }))

  // 404 fallback for all unmatched routes
  app.notFound((c) => c.json(notFound(), 404))

  return app
}
