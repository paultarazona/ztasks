/**
 * tasksService — Slice 1 stub.
 * Forwards to InsForge internally. Slice 4 will replace with real apiClient calls.
 */
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

export async function getTasksByCategory(userId: string, categoryId: string): Promise<Task[]> {
  const { data, error } = await insforge
    .database.from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Task[]
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { user_id, ...rest } = input
  const { data, error } = await insforge
    .database.from('tasks')
    .insert([{ ...rest, user_id }])
    .select()
    .single()

  if (error) throw error
  return data as Task
}

export async function updateTask({ id, user_id, ...input }: UpdateTaskInput): Promise<Task> {
  const { data, error } = await insforge
    .database.from('tasks')
    .update(input)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  const { error } = await insforge
    .database.from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function reorderTasks(
  _userId: string,
  _updates: Array<{ id: string; position: number }>,
): Promise<void> {
  // Stub: reorder is handled client-side via optimistic updates in Slice 1.
  // Slice 4 will call PATCH /tasks/:id for each update.
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
