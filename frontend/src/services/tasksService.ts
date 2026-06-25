import { api } from '../lib/apiClient'
import type { Task, Priority } from '../types'

export interface CreateTaskInput {
  title: string
  categoryId: string
  statusId: string
  description?: string
  priority?: Priority
  dueDate?: string | null
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string | null
  priority?: Priority
  statusId?: string
  dueDate?: string | null
}

export interface ReorderTasksInput {
  id: string
  updates: Array<{ id: string; position: number }>
}

export function getTasksByCategory(categoryId: string): Promise<Task[]> {
  return api<Task[]>('GET', `/tasks?categoryId=${encodeURIComponent(categoryId)}`)
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  const { categoryId, statusId, dueDate, ...rest } = input
  return api<Task>('POST', '/tasks', {
    ...rest,
    categoryId,
    statusId,
    dueDate: dueDate ?? null,
  })
}

export function updateTask({ id, statusId, dueDate, ...rest }: UpdateTaskInput): Promise<Task> {
  const body: Record<string, unknown> = { ...rest }
  if (statusId !== undefined) body.statusId = statusId
  if (dueDate !== undefined) body.dueDate = dueDate
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
