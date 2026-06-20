/**
 * taskStatusesService — Slice 1 stub.
 * Forwards to InsForge internally. Slice 4 will replace with real apiClient calls.
 */
import { insforge } from '../lib/insforge'
import type { TaskStatus } from '../types'

export async function getGlobalStatuses(userId: string): Promise<TaskStatus[]> {
  const { data, error } = await insforge
    .database.from('task_statuses')
    .select('*')
    .eq('user_id', userId)
    .is('category_id', null)
    .order('position')

  if (error) throw error
  return (data ?? []) as TaskStatus[]
}

export async function getCategoryStatuses(userId: string, categoryId: string): Promise<TaskStatus[]> {
  const { data, error } = await insforge
    .database.from('task_statuses')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .order('position')

  if (error) throw error
  return (data ?? []) as TaskStatus[]
}

export async function seedGlobalStatuses(userId: string): Promise<TaskStatus[]> {
  const defaults = [
    { user_id: userId, name: 'Pendiente', position: 0, color: '#6b7280' },
    { user_id: userId, name: 'En progreso', position: 1, color: '#6366f1' },
    { user_id: userId, name: 'Completado', position: 2, color: '#22c55e' },
  ]

  const { data, error } = await insforge
    .database.from('task_statuses')
    .insert(defaults)
    .select()

  if (error) throw error
  return data as TaskStatus[]
}
