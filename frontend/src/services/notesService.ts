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
  taskId: string
  content: string
  userId: string
}): Promise<TaskNote> {
  return api<TaskNote>('POST', '/task-notes', {
    taskId: input.taskId,
    content: input.content,
  })
}

export async function updateNote(id: string, _userId: string, content: string): Promise<TaskNote> {
  return api<TaskNote>('PATCH', `/task-notes/${encodeURIComponent(id)}`, { content })
}

export async function deleteNote(id: string, _userId: string): Promise<void> {
  await api<void>('DELETE', `/task-notes/${encodeURIComponent(id)}`)
}
