import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We import dynamically so we can control env before module load
const VALID_BASE_URL = 'http://localhost:3000'

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', VALID_BASE_URL)
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  describe('ApiError', () => {
    it('throws ApiError with status, code, and message on 4xx response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found', code: 'NOT_FOUND' }),
      })
      vi.stubGlobal('fetch', fetchMock)

      const { api, ApiError } = await import('./apiClient')

      await expect(api('GET', '/tasks')).rejects.toSatisfy((err: unknown) => {
        if (!(err instanceof ApiError)) return false
        return err.status === 404 && err.code === 'NOT_FOUND' && err.message === 'Not found'
      })
    })

    it('throws ApiError on 5xx response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal error', code: 'INTERNAL_ERROR' }),
      })
      vi.stubGlobal('fetch', fetchMock)

      const { api, ApiError } = await import('./apiClient')

      await expect(api('GET', '/tasks')).rejects.toBeInstanceOf(ApiError)
    })

    it('returns parsed JSON on 2xx response', async () => {
      const mockData = [{ id: '1', title: 'Task 1' }]
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      })
      vi.stubGlobal('fetch', fetchMock)

      const { api } = await import('./apiClient')

      const result = await api('GET', '/tasks')
      expect(result).toEqual(mockData)
    })

    it('sends credentials: include on every request', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      vi.stubGlobal('fetch', fetchMock)

      const { api } = await import('./apiClient')
      await api('GET', '/tasks')

      expect(fetchMock).toHaveBeenCalledWith(
        `${VALID_BASE_URL}/tasks`,
        expect.objectContaining({ credentials: 'include' }),
      )
    })

    it('sends JSON body on POST request', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ id: '1' }),
      })
      vi.stubGlobal('fetch', fetchMock)

      const { api } = await import('./apiClient')
      await api('POST', '/tasks', { title: 'New Task' })

      expect(fetchMock).toHaveBeenCalledWith(
        `${VALID_BASE_URL}/tasks`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'New Task' }),
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      )
    })
  })

  describe('config error', () => {
    it('throws config error at import when VITE_API_URL is undefined', async () => {
      vi.unstubAllEnvs()
      vi.stubEnv('VITE_API_URL', '')

      await expect(import('./apiClient')).rejects.toThrow(/VITE_API_URL/)
    })
  })
})
