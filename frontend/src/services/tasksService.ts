/**
 * tasksService — Slice 1 service boundary.
 * Task CRUD functions use apiClient; pending-count helpers remain temporary InsForge adapters until their SDD tasks run.
 */
import { api } from '../lib/apiClient'
import { insforge } from '../lib/insforge'
import type { Task, Priority, TaskStatus } from '../types'

export interface CreateTaskInput {
  title: string
  category_id: string
  status_id: string
  user_id: string
  description?: string
  priority?: Priority
  due_date?: string | null
}

export interface UpdateTaskInput {
  id: string
  user_id: string
  title?: string
  description?: string | null
  priority?: Priority
  status_id?: string
  due_date?: string | null
}

export interface ReorderTasksInput {
  id: string
  user_id: string
  updates: Array<{ id: string; position: number }>
}

export function getTasksByCategory(categoryId: string): Promise<Task[]>
export function getTasksByCategory(_userId: string, categoryId: string): Promise<Task[]>
export function getTasksByCategory(
  userIdOrCategoryId: string,
  maybeCategoryId?: string,
): Promise<Task[]> {
  const categoryId = maybeCategoryId ?? userIdOrCategoryId
  return api<Task[]>('GET', `/tasks?categoryId=${encodeURIComponent(categoryId)}`)
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  const { user_id, ...body } = input
  void user_id
  return api<Task>('POST', '/tasks', body)
}

export function updateTask({ id, user_id, ...body }: UpdateTaskInput): Promise<Task> {
  void user_id
  return api<Task>('PATCH', `/tasks/${encodeURIComponent(id)}`, body)
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  void userId
  await api<void>('DELETE', `/tasks/${encodeURIComponent(id)}`)
}

export async function reorderTasks(
  userId: string,
  updates: Array<{ id: string; position: number }>,
): Promise<void> {
  void userId
  await Promise.all(
    updates.map(({ id, position }) =>
      api<void>('PATCH', `/tasks/${encodeURIComponent(id)}/reorder`, { position }),
    ),
  )
}

export async function getPendingTaskCounts(
  userId: string,
): Promise<{ tasks: Array<{ category_id: string; status_id: string }>; statuses: TaskStatus[] }> {
  const [tasksResult, statusesResult] = await Promise.all([
    insforge.database.from('tasks').select('category_id,status_id').eq('user_id', userId),
    insforge.database.from('task_statuses').select('id,name').eq('user_id', userId),
  ])

  if (tasksResult.error) throw tasksResult.error
  if (statusesResult.error) throw statusesResult.error

  return {
    tasks: (tasksResult.data ?? []) as Array<{ category_id: string; status_id: string }>,
    statuses: (statusesResult.data ?? []) as TaskStatus[],
  }
}
