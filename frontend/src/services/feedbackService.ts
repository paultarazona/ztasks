/**
 * feedbackService — real implementation using apiClient.
 * Slice 4: replaced InsForge stubs with direct apiClient calls.
 */
import { api, ApiError } from '../lib/apiClient'

export interface Feedback {
  id: string
  userId: string
  type: 'feedback' | 'suggestion' | 'bug'
  message: string
  isRead: boolean | null
  createdAt: string
}

export interface FeedbackStats {
  totalFeedbacks: number
  totalUsers: number
  unreads: number
  byType: Record<string, number>
}

export async function submitFeedback(input: {
  userId: string
  type: 'feedback' | 'suggestion' | 'bug'
  message: string
}): Promise<void> {
  const { userId, ...body } = input
  void userId
  await api<void>('POST', '/feedback', body)
}

export async function getFeedbacks(): Promise<Feedback[]> {
  return api<Feedback[]>('GET', '/feedback')
}

export async function markRead(id: string, read: boolean, _userId: string): Promise<void> {
  await api<void>('PATCH', `/feedback/${encodeURIComponent(id)}`, {
    isRead: read,
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
