/**
 * realtimeService — EventSource-based SSE subscriptions for realtime updates.
 * Connects to the backend SSE endpoints at /realtime/* using the browser's
 * native EventSource API with credentials (cookies) forwarded.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export type TaskEventType = 'task_created' | 'task_updated' | 'task_deleted'
export type FeedbackEventType = 'INSERT_feedback' | 'UPDATE_feedback' | 'DELETE_feedback'

export interface TaskEventHandlers {
  onTaskCreated?: (payload: Record<string, unknown>) => void
  onTaskUpdated?: (payload: Record<string, unknown>) => void
  onTaskDeleted?: (payload: { id?: string }) => void
}

export interface FeedbackEventHandlers {
  onInsert?: () => void
  onUpdate?: () => void
  onDelete?: () => void
}

/**
 * Subscribe to task domain events for a given user + category channel.
 * Opens an SSE connection to /realtime/tasks/:categoryId.
 * The userId is authenticated server-side; only categoryId is passed in the URL.
 * Returns a cleanup function that closes the EventSource connection.
 */
export function subscribeToTaskChannel(
  _userId: string,
  categoryId: string,
  handlers: TaskEventHandlers,
): () => void {
  const es = new EventSource(`${BASE_URL}/realtime/tasks/${categoryId}`, {
    withCredentials: true,
  })

  es.addEventListener('task_created', (e: MessageEvent) => {
    const payload = JSON.parse(e.data)
    handlers.onTaskCreated?.(payload)
  })

  es.addEventListener('task_updated', (e: MessageEvent) => {
    const payload = JSON.parse(e.data)
    handlers.onTaskUpdated?.(payload)
  })

  es.addEventListener('task_deleted', (e: MessageEvent) => {
    const payload = JSON.parse(e.data)
    handlers.onTaskDeleted?.(payload)
  })

  return () => es.close()
}

/**
 * Publish a task event — no-op: realtime events are pushed from the server.
 * Client-side publish is not needed with the SSE model.
 */
export async function publishTaskEvent(
  _userId: string,
  _categoryId: string,
  _event: string,
  _payload: Record<string, unknown>,
): Promise<void> {
  // No-op: realtime events are pushed from the server via SSE.
}

/**
 * Subscribe to feedback admin events.
 * Opens an SSE connection to /realtime/feedback.
 * Calls onInsert/onUpdate/onDelete when the corresponding events arrive.
 * Returns a cleanup function that closes the EventSource connection.
 */
export function subscribeToFeedbackChannel(handlers: FeedbackEventHandlers): () => void {
  const es = new EventSource(`${BASE_URL}/realtime/feedback`, {
    withCredentials: true,
  })

  es.addEventListener('feedback_created', () => {
    handlers.onInsert?.()
  })

  es.addEventListener('feedback_updated', () => {
    handlers.onUpdate?.()
  })

  es.addEventListener('feedback_deleted', () => {
    handlers.onDelete?.()
  })

  return () => es.close()
}

/**
 * Generic SSE channel subscription.
 * Constructs an EventSource at /realtime/:channel and maps the `message`
 * event to the onMessage handler.
 * Returns a cleanup function that closes the EventSource connection.
 */
export function subscribe(
  channel: string,
  handlers: Record<string, (payload: unknown) => void>,
): () => void {
  const es = new EventSource(`${BASE_URL}/realtime/${channel}`, {
    withCredentials: true,
  })

  es.addEventListener('message', (e: MessageEvent) => {
    const payload = JSON.parse(e.data)
    handlers.onMessage?.(payload)
  })

  return () => es.close()
}
