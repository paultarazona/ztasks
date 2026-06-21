/**
 * taskStatusesService — real implementation using apiClient.
 * Slice 4: replaced InsForge stubs with direct apiClient calls.
 *
 * Note: seedGlobalStatuses is now a no-op — seeding happens via SQL migration,
 * not via an API call.
 */
import { api } from '../lib/apiClient'
import type { TaskStatus } from '../types'

export async function getGlobalStatuses(_userId: string): Promise<TaskStatus[]> {
  return api<TaskStatus[]>('GET', '/task-statuses')
}

export async function getCategoryStatuses(_userId: string, categoryId: string): Promise<TaskStatus[]> {
  return api<TaskStatus[]>('GET', `/task-statuses?categoryId=${encodeURIComponent(categoryId)}`)
}

export async function seedGlobalStatuses(_userId: string): Promise<TaskStatus[]> {
  // Seeding is handled by SQL migration (003_seed_task_statuses.sql).
  // This function is retained for interface compatibility but does nothing.
  return Promise.resolve([])
}
