import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './useAuthStore'
import * as notesService from '../services/notesService'
import type { TaskNote } from '../types'

export function useTaskNotes(taskId?: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  const query = useQuery({
    queryKey: ['task_notes', taskId, userId],
    queryFn: () => notesService.getNotesByTask(userId!, taskId!),
    enabled: !!taskId && !!userId,
  })

  const createNote = useMutation({
    mutationFn: async (input: { task_id: string; content: string }) => {
      const currentUserId = useAuthStore.getState().user?.id!
      return notesService.createNote({ ...input, user_id: currentUserId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_notes'] })
    },
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const currentUserId = useAuthStore.getState().user?.id!
      return notesService.updateNote(id, currentUserId, content)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_notes'] })
    },
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const currentUserId = useAuthStore.getState().user?.id!
      return notesService.deleteNote(id, currentUserId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_notes'] })
    },
  })

  return { ...query, createNote, updateNote, deleteNote }
}
