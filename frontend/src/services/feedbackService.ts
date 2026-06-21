/**
 * feedbackService — real implementation using apiClient.
 * Slice 4: replaced InsForge stubs with direct apiClient calls.
 */
import { api, ApiError } from '../lib/apiClient'

export interface Feedback {
  id: string
  user_id: string
  type: 'feedback' | 'suggestion' | 'bug'
  message: string
  read_at: string | null
  read_by: string | null
  created_at: string
}

export interface FeedbackStats {
  totalFeedbacks: number
  totalUsers: number
  unreads: number
  byType: Record<string, number>
}

export async function submitFeedback(input: {
  user_id: string
  type: 'feedback' | 'suggestion' | 'bug'
  message: string
}): Promise<void> {
  const { user_id, ...body } = input
  void user_id
  await api<void>('POST', '/feedback', body)
}

export async function getFeedbacks(): Promise<Feedback[]> {
  return api<Feedback[]>('GET', '/feedback')
}

export async function markRead(id: string, read: boolean, _userId: string): Promise<void> {
  await api<void>('PATCH', `/feedback/${encodeURIComponent(id)}`, {
    read_at: read ? new Date().toISOString() : null,
    read_by: read ? null : null,
  })
}

export async function deleteFeedback(id: string): Promise<void> {
  await api<void>('DELETE', `/feedback/${encodeURIComponent(id)}`)
}

export async function getStats(): Promise<FeedbackStats | null> {
  try {
    return await api<FeedbackStats>('GET', '/feedback/stats')
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function getAdminUsers(): Promise<unknown[]> {
  return api<unknown[]>('GET', '/admin/users')
}
