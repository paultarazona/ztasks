import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './useAuthStore'
import * as notesService from '../services/notesService'

export function useTaskNotes(taskId?: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  const getCurrentUserId = () => {
    const currentUserId = useAuthStore.getState().user?.id
    if (!currentUserId) throw new Error('User must be authenticated')
    return currentUserId
  }

  const query = useQuery({
    queryKey: ['task_notes', taskId, userId],
    queryFn: () => notesService.getNotesByTask(userId!, taskId!),
    enabled: !!taskId && !!userId,
  })

  const createNote = useMutation({
    mutationFn: async (input: { taskId: string; content: string }) => {
      const currentUserId = getCurrentUserId()
      return notesService.createNote({ ...input, userId: currentUserId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_notes'] })
    },
  })

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const currentUserId = getCurrentUserId()
      return notesService.updateNote(id, currentUserId, content)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_notes'] })
    },
  })

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const currentUserId = getCurrentUserId()
      return notesService.deleteNote(id, currentUserId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_notes'] })
    },
  })

  return { ...query, createNote, updateNote, deleteNote }
}
