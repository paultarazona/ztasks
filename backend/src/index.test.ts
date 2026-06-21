import { describe, it, expect } from 'vitest'
import { createApp } from './app'

describe('GET /health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const app = createApp()
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })
})

describe('GET /unknown-route', () => {
  it('returns 404 with { error: "Not found", code: "NOT_FOUND" }', async () => {
    const app = createApp()
    const res = await app.request('/unknown-route')
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'Not found', code: 'NOT_FOUND' })
  })

  it('returns 404 for another unknown path', async () => {
    const app = createApp()
    const res = await app.request('/api/does-not-exist')
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('NOT_FOUND')
  })
})
