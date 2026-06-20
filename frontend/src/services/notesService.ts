/**
 * notesService — Slice 1 stub.
 * Forwards to InsForge internally. Slice 4 will replace with real apiClient calls.
 */
import { insforge } from '../lib/insforge'
import type { TaskNote } from '../types'

export async function getNotesByTask(userId: string, taskId: string): Promise<TaskNote[]> {
  const { data, error } = await insforge
    .database.from('task_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as TaskNote[]
}

export async function createNote(input: {
  task_id: string
  content: string
  user_id: string
}): Promise<TaskNote> {
  const { user_id, ...rest } = input
  const { data, error } = await insforge
    .database.from('task_notes')
    .insert([{ ...rest, user_id }])
    .select()
    .single()

  if (error) throw error
  return data as TaskNote
}

export async function updateNote(id: string, userId: string, content: string): Promise<TaskNote> {
  const { data, error } = await insforge
    .database.from('task_notes')
    .update({ content })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as TaskNote
}

export async function deleteNote(id: string, userId: string): Promise<void> {
  const { error } = await insforge
    .database.from('task_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
