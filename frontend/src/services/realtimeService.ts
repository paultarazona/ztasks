/**
 * realtimeService — Slice 1 stub.
 * Wraps InsForge realtime internally. Slice 5 will replace with real EventSource.
 */
import { insforge } from '../lib/insforge'

export type TaskEventType = 'task_created' | 'task_updated' | 'task_deleted'
export type FeedbackEventType = 'INSERT_feedback' | 'UPDATE_feedback' | 'DELETE_feedback'

export interface TaskEventHandlers {
  onTaskCreated?: (payload: { task?: unknown }) => void
  onTaskUpdated?: (payload: { task?: unknown }) => void
  onTaskDeleted?: (payload: { taskId?: string }) => void
}

export interface FeedbackEventHandlers {
  onInsert?: () => void
  onUpdate?: () => void
  onDelete?: () => void
}

/**
 * Subscribe to task domain events for a given channel.
 * Returns a cleanup function that removes listeners and unsubscribes.
 */
export function subscribeToTaskChannel(
  userId: string,
  categoryId: string,
  handlers: TaskEventHandlers,
): () => void {
  const channel = `tasks:${userId}:${categoryId}`

  const handleCreated = (payload: { task?: unknown }) => handlers.onTaskCreated?.(payload)
  const handleUpdated = (payload: { task?: unknown }) => handlers.onTaskUpdated?.(payload)
  const handleDeleted = (payload: { taskId?: string }) => handlers.onTaskDeleted?.(payload)

  insforge.realtime.on('task_created', handleCreated)
  insforge.realtime.on('task_updated', handleUpdated)
  insforge.realtime.on('task_deleted', handleDeleted)

  const connectAndSubscribe = async () => {
    try {
      if (!insforge.realtime.isConnected) {
        await insforge.realtime.connect()
      }
      await insforge.realtime.subscribe(channel)
    } catch {
      // Realtime is additive; DB mutations still work if the socket is unavailable.
    }
  }

  connectAndSubscribe()

  return () => {
    insforge.realtime.off('task_created', handleCreated)
    insforge.realtime.off('task_updated', handleUpdated)
    insforge.realtime.off('task_deleted', handleDeleted)
    insforge.realtime.unsubscribe(channel)
  }
}

/**
 * Publish a task event to the channel.
 */
export async function publishTaskEvent(
  userId: string,
  categoryId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await insforge.realtime.publish(`tasks:${userId}:${categoryId}`, event, payload)
  } catch {
    // Realtime must not block the persisted DB mutation flow.
  }
}

/**
 * Subscribe to feedback admin events.
 * Returns a cleanup function.
 */
export function subscribeToFeedbackChannel(handlers: FeedbackEventHandlers): () => void {
  const handleInsert = () => handlers.onInsert?.()
  const handleUpdate = () => handlers.onUpdate?.()
  const handleDelete = () => handlers.onDelete?.()

  insforge.realtime.on('INSERT_feedback', handleInsert)
  insforge.realtime.on('UPDATE_feedback', handleUpdate)
  insforge.realtime.on('DELETE_feedback', handleDelete)

  const connectAndSubscribe = async () => {
    try {
      if (insforge.realtime.isConnected) {
        await insforge.realtime.subscribe('feedback')
      } else {
        await insforge.realtime.connect()
        await insforge.realtime.subscribe('feedback')
      }
    } catch {
      // Best-effort
    }
  }

  connectAndSubscribe()

  return () => {
    insforge.realtime.off('INSERT_feedback', handleInsert)
    insforge.realtime.off('UPDATE_feedback', handleUpdate)
    insforge.realtime.off('DELETE_feedback', handleDelete)
  }
}

/**
 * Generic subscribe for future use (Slice 5 real EventSource signature).
 * Stub: returns no-op cleanup during Slice 1.
 */
export function subscribe(
  _channel: string,
  _handlers: Record<string, (payload: unknown) => void>,
): () => void {
  void _channel
  void _handlers
  // Slice 5 will wire this to EventSource
  return () => {}
}
