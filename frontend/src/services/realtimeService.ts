/**
 * realtimeService — no-op stub pending Slice 5 real EventSource implementation.
 * Slice 4: removed InsForge realtime dependency. All functions are no-ops until
 * Slice 5 wires them to the backend SSE endpoints.
 */

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
 * Slice 5 will replace this no-op with real EventSource subscriptions.
 */
export function subscribeToTaskChannel(
  _userId: string,
  _categoryId: string,
  _handlers: TaskEventHandlers,
): () => void {
  return () => {}
}

/**
 * Publish a task event to the channel.
 * Slice 5 will wire mutations to broadcast via backend SSE; client-side publish is no longer needed.
 */
export async function publishTaskEvent(
  _userId: string,
  _categoryId: string,
  _event: string,
  _payload: Record<string, unknown>,
): Promise<void> {
  // No-op: realtime events are pushed from the server in Slice 5.
}

/**
 * Subscribe to feedback admin events.
 * Slice 5 will replace this no-op with real EventSource subscriptions.
 */
export function subscribeToFeedbackChannel(_handlers: FeedbackEventHandlers): () => void {
  return () => {}
}

/**
 * Generic subscribe (Slice 5 real EventSource signature).
 * Returns no-op cleanup until Slice 5 implementation.
 */
export function subscribe(
  _channel: string,
  _handlers: Record<string, (payload: unknown) => void>,
): () => void {
  return () => {}
}
