/**
 * notesService — real implementation using apiClient.
 * Slice 4: replaced InsForge stubs with direct apiClient calls.
 */
import { api } from '../lib/apiClient'
import type { TaskNote } from '../types'

export async function getNotesByTask(_userId: string, taskId: string): Promise<TaskNote[]> {
  return api<TaskNote[]>('GET', `/task-notes?taskId=${encodeURIComponent(taskId)}`)
}

export async function createNote(input: {
  task_id: string
  content: string
  user_id: string
}): Promise<TaskNote> {
  const { user_id, ...body } = input
  void user_id
  return api<TaskNote>('POST', '/task-notes', body)
}

export async function updateNote(id: string, _userId: string, content: string): Promise<TaskNote> {
  return api<TaskNote>('PATCH', `/task-notes/${encodeURIComponent(id)}`, { content })
}

export async function deleteNote(id: string, _userId: string): Promise<void> {
  await api<void>('DELETE', `/task-notes/${encodeURIComponent(id)}`)
}
