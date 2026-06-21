import { describe, it, expect } from 'vitest'
import { createApp } from '../app'

describe('GET /docs/openapi.json', () => {
  it('returns 200 with application/json content-type', async () => {
    const app = createApp()
    const res = await app.request('/docs/openapi.json')
    expect(res.status).toBe(200)
    const ct = res.headers.get('content-type')
    expect(ct).toContain('application/json')
  })

  it('body contains a paths object with /tasks and /auth/me keys', async () => {
    const app = createApp()
    const res = await app.request('/docs/openapi.json')
    const body = await res.json()
    expect(body).toHaveProperty('paths')
    expect(body.paths).toHaveProperty('/tasks')
    expect(body.paths).toHaveProperty('/auth/me')
  })
})
