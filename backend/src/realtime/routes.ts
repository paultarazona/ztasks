import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { AppEnv } from '../shared/auth'
import { requireAuth } from '../shared/middleware/requireAuth'
import { sseManager } from '../shared/sse'
import type { SSEStream } from '../shared/sse'

export const realtimeRouter = new Hono<AppEnv>()

/**
 * GET /realtime/tasks/:categoryId
 * Opens an SSE stream scoped to the authenticated user + category.
 * Sends a heartbeat comment every 30 seconds to keep the connection alive.
 */
realtimeRouter.get('/tasks/:categoryId', requireAuth, (c) => {
  const user = c.get('user')
  const categoryId = c.req.param('categoryId')
  const channel = `tasks:${user.id}:${categoryId}`

  return streamSSE(c, async (stream) => {
    const sseStream: SSEStream = {
      write: (data: string) => {
        // streamSSE gives us writeSSE, but we need raw write for pre-formatted data
        stream.write(data)
      },
    }

    sseManager.register(channel, sseStream)

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      stream.write(': heartbeat\n\n')
    }, 30_000)

    // Clean up when the client disconnects
    stream.onAbort(() => {
      clearInterval(heartbeatInterval)
      sseManager.unregister(channel, sseStream)
    })

    // Keep the stream open until the client closes it
    await new Promise<void>((resolve) => {
      stream.onAbort(resolve)
    })
  })
})

/**
 * GET /realtime/feedback
 * Opens an SSE stream for admin feedback events.
 * Requires authentication (admin check is enforced in the broadcast source).
 */
realtimeRouter.get('/feedback', requireAuth, (c) => {
  const channel = 'feedback:admin'

  return streamSSE(c, async (stream) => {
    const sseStream: SSEStream = {
      write: (data: string) => {
        stream.write(data)
      },
    }

    sseManager.register(channel, sseStream)

    const heartbeatInterval = setInterval(() => {
      stream.write(': heartbeat\n\n')
    }, 30_000)

    stream.onAbort(() => {
      clearInterval(heartbeatInterval)
      sseManager.unregister(channel, sseStream)
    })

    await new Promise<void>((resolve) => {
      stream.onAbort(resolve)
    })
  })
})
