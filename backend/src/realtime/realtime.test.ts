import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock the db module (not used by realtime routes, but avoids import side-effects)
vi.mock('../shared/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock the sseManager to avoid side-effects and inspect calls
vi.mock('../shared/sse', () => ({
  sseManager: {
    register: vi.fn(),
    unregister: vi.fn(),
    broadcast: vi.fn(),
  },
  SSEManager: vi.fn(),
}))

import { realtimeRouter } from './routes'

function makeApp(user?: { id: string; email: string; name: string; avatar_url: string | null }) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    if (user) {
      c.set('user' as never, user)
    }
    await next()
  })
  app.route('/realtime', realtimeRouter)
  return app
}

const stubUser = { id: 'u1', email: 'u@test.com', name: 'User', avatar_url: null }

describe('GET /realtime/tasks/:categoryId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no user is authenticated', async () => {
    const app = makeApp()
    const res = await app.request('/realtime/tasks/42')
    expect(res.status).toBe(401)
  })

  it('returns text/event-stream content-type when user is authenticated', async () => {
    const app = makeApp(stubUser)
    const res = await app.request('/realtime/tasks/42')
    // SSE response must have the correct content-type header
    expect(res.headers.get('content-type')).toContain('text/event-stream')
  })
})

describe('GET /realtime/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no user is authenticated', async () => {
    const app = makeApp()
    const res = await app.request('/realtime/feedback')
    expect(res.status).toBe(401)
  })
})
