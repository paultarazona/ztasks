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

// Mock getSession so requireAuth never hits a real DB
vi.mock('../shared/auth', () => ({
  getSession: vi.fn(),
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

import { getSession } from '../shared/auth'
import { realtimeRouter } from './routes'

const mockGetSession = vi.mocked(getSession)

const stubUser = { id: 'u1', email: 'u@test.com', name: 'User', image: null }
const stubSession = {
  session: { id: 'sess-1', userId: 'u1', expiresAt: new Date(), token: 'tok' },
  user: stubUser,
}

function makeApp(authenticated = false) {
  const app = new Hono()
  if (authenticated) {
    mockGetSession.mockResolvedValue(stubSession as never)
  } else {
    mockGetSession.mockResolvedValue(null)
  }
  app.route('/realtime', realtimeRouter)
  return app
}

describe('GET /realtime/tasks/:categoryId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no user is authenticated', async () => {
    const app = makeApp(false)
    const res = await app.request('/realtime/tasks/42')
    expect(res.status).toBe(401)
  })

  it('returns text/event-stream content-type when user is authenticated', async () => {
    const app = makeApp(true)
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
    const app = makeApp(false)
    const res = await app.request('/realtime/feedback')
    expect(res.status).toBe(401)
  })
})
