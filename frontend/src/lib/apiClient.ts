import { ApiError } from './errors'

export { ApiError }

const baseUrl = import.meta.env.VITE_API_URL as string | undefined

if (!baseUrl) {
  throw new Error(
    'VITE_API_URL is not defined. Set it in your .env file before starting the app.',
  )
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export async function api<T = unknown>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${baseUrl}${path}`

  const init: RequestInit = {
    method,
    credentials: 'include',
  }

  if (['POST', 'PUT', 'PATCH'].includes(method) || body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body ?? {})
  }

  const response = await fetch(url, init)

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    let code: string | undefined
    let details: unknown

    try {
      const payload = await response.json()
      if (typeof payload?.message === 'string') message = payload.message
      if (typeof payload?.error === 'string') message = payload.error
      if (typeof payload?.code === 'string') code = payload.code
      if (payload?.fields !== undefined) details = payload.fields
      if (payload?.details !== undefined) details = payload.details
    } catch {
      // JSON parse failed — keep defaults
    }

    throw new ApiError(message, response.status, code, details)
  }

  return response.json() as Promise<T>
}
