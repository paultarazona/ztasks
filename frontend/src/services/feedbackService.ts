/**
 * feedbackService — Slice 1 stub.
 * Forwards to InsForge internally. Slice 4 will replace with real apiClient calls.
 */
import { insforge } from '../lib/insforge'

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
  const { error } = await insforge.database
    .from('feedback')
    .insert(input)
    .select()
    .single()

  if (error) throw error
}

export async function getFeedbacks(): Promise<Feedback[]> {
  const { data, error } = await insforge
    .database.from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Feedback[]
}

export async function markRead(id: string, read: boolean, userId: string): Promise<void> {
  const { error } = await insforge
    .database.from('feedback')
    .update({
      read_at: read ? new Date().toISOString() : null,
      read_by: read ? userId : null,
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await insforge.database.from('feedback').delete().eq('id', id)
  if (error) throw error
}

export async function getStats(): Promise<FeedbackStats> {
  const [feedbackRes, userRes] = await Promise.all([
    insforge.database.from('feedback').select('*', { count: 'exact' }),
    insforge.database.from('user_profiles').select('*', { count: 'exact' }),
  ])

  const unreads = feedbackRes.data?.filter((f: Feedback) => !f.read_at).length ?? 0
  const byType = feedbackRes.data?.reduce((acc: Record<string, number>, f: Feedback) => {
    acc[f.type] = (acc[f.type] ?? 0) + 1
    return acc
  }, {})

  return {
    totalFeedbacks: feedbackRes.count ?? 0,
    totalUsers: userRes.count ?? 0,
    unreads,
    byType: byType ?? {},
  }
}

export async function getAdminUsers(): Promise<unknown[]> {
  const { data, error } = await insforge
    .database.from('user_profiles_with_email')
    .select('*')
    .order('last_login', { ascending: false })

  if (error) throw error
  return data as unknown[]
}
