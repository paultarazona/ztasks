import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'

// Mock getSession before importing routes so requireAuth never hits a real DB
vi.mock('../shared/auth', () => ({
  getSession: vi.fn(),
  auth: {
    handler: vi.fn(async () => new Response('Not Implemented', { status: 501 })),
  },
}))

import { getSession } from '../shared/auth'
import { authRouter } from './routes'

const mockGetSession = vi.mocked(getSession)

const stubUser = { id: 'user-1', email: 'test@example.com', name: 'Test User', emailVerified: false, image: null }
const stubSession = {
  session: { id: 'sess-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' },
  user: stubUser,
}

function makeApp(authenticated = false) {
  const app = new Hono()
  if (authenticated) {
    mockGetSession.mockResolvedValue(stubSession as never)
  } else {
    mockGetSession.mockResolvedValue(null)
  }
  app.route('/auth', authRouter)
  return app
}

describe('GET /auth/me', () => {
  it('returns user fields when authenticated', async () => {
    const app = makeApp(true)
    const res = await app.request('/auth/me')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: null,
    })
  })

  it('returns 401 when no user is set', async () => {
    const app = makeApp(false)
    const res = await app.request('/auth/me')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('UNAUTHORIZED')
  })
})

describe('GET /auth/login stub', () => {
  it('returns 501', async () => {
    const app = makeApp()
    const res = await app.request('/auth/login')
    expect(res.status).toBe(501)
  })
})

describe('POST /auth/register stub', () => {
  it('returns 501', async () => {
    const app = makeApp()
    const res = await app.request('/auth/register', { method: 'POST' })
    expect(res.status).toBe(501)
  })
})

describe('POST /auth/logout stub', () => {
  it('returns 501', async () => {
    const app = makeApp()
    const res = await app.request('/auth/logout', { method: 'POST' })
    expect(res.status).toBe(501)
  })
})
