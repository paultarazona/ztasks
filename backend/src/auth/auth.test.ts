import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { authRouter } from './routes'

function makeApp(user?: { id: string; email: string; name: string; avatar_url: string | null }) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    if (user) {
      c.set('user' as never, user)
    }
    await next()
  })
  app.route('/auth', authRouter)
  return app
}

const stubUser = { id: 'user-1', email: 'test@example.com', name: 'Test User', avatar_url: null }

describe('GET /auth/me', () => {
  it('returns user fields when authenticated', async () => {
    const app = makeApp(stubUser)
    const res = await app.request('/auth/me')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ id: 'user-1', email: 'test@example.com', name: 'Test User', avatar_url: null })
  })

  it('returns 401 when no user is set', async () => {
    const app = makeApp()
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
