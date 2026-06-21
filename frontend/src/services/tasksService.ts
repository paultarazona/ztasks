import { api } from '../lib/apiClient'
import type { Task, Priority } from '../types'

export interface CreateTaskInput {
  title: string
  category_id: string
  status_id: string
  description?: string
  priority?: Priority
  due_date?: string | null
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string | null
  priority?: Priority
  status_id?: string
  due_date?: string | null
}

export interface ReorderTasksInput {
  id: string
  updates: Array<{ id: string; position: number }>
}

export function getTasksByCategory(categoryId: string): Promise<Task[]> {
  return api<Task[]>('GET', `/tasks?categoryId=${encodeURIComponent(categoryId)}`)
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return api<Task>('POST', '/tasks', input)
}

export function updateTask({ id, ...body }: UpdateTaskInput): Promise<Task> {
  return api<Task>('PATCH', `/tasks/${encodeURIComponent(id)}`, body)
}

export async function deleteTask(id: string): Promise<void> {
  await api<void>('DELETE', `/tasks/${encodeURIComponent(id)}`)
}

export async function reorderTasks(updates: Array<{ id: string; position: number }>): Promise<void> {
  await Promise.all(
    updates.map(({ id, position }) =>
      api<void>('PATCH', `/tasks/${encodeURIComponent(id)}/reorder`, { position }),
    ),
  )
}

export async function getPendingTaskCounts(): Promise<Record<string, number>> {
  return api('GET', '/tasks/pending-counts')
}
