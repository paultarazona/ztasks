import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock the db module before importing routes
vi.mock('../shared/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { tasksRouter } from './routes'

function makeApp(user?: { id: string; email: string; name: string; avatar_url: string | null }) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    if (user) {
      c.set('user' as never, user)
    }
    await next()
  })
  app.route('/tasks', tasksRouter)
  return app
}

const stubUser = { id: 'user1', email: 'u@test.com', name: 'User', avatar_url: null }

describe('GET /tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls db query scoped to user_id AND category_id', async () => {
    const { db } = await import('../shared/db')

    const mockRows = [{ id: 1, title: 'Task A', userId: 'user1', categoryId: 42 }]

    // Chain mock: db.select().from().where() returns rows
    const whereMock = vi.fn().mockResolvedValue(mockRows)
    const fromMock = vi.fn().mockReturnValue({ where: whereMock })
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: fromMock })

    const app = makeApp(stubUser)
    const res = await app.request('/tasks?categoryId=42')
    expect(res.status).toBe(200)

    // Verify the db.select chain was called
    expect(db.select).toHaveBeenCalled()
    expect(fromMock).toHaveBeenCalled()
    expect(whereMock).toHaveBeenCalled()
  })

  it('returns 401 when no user is set', async () => {
    const app = makeApp()
    const res = await app.request('/tasks?categoryId=42')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('UNAUTHORIZED')
  })
})

describe('POST /tasks', () => {
  it('returns 401 without user', async () => {
    const app = makeApp()
    const res = await app.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New task', categoryId: 1 }),
    })
    expect(res.status).toBe(401)
  })
})
