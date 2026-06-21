import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './useAuthStore'
import * as feedbackService from '../services/feedbackService'

export type { Feedback } from '../services/feedbackService'

export function useAdminFeedbacks() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  const feedbacks = useQuery({
    queryKey: ['admin-feedbacks'],
    queryFn: () => feedbackService.getFeedbacks(),
  })

  const markAsRead = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      await feedbackService.markRead(id, read, userId!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] })
    },
  })

  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      await feedbackService.deleteFeedback(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] })
    },
  })

  return { ...feedbacks, markAsRead, deleteFeedback }
}

export function useAdminStats() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['admin-stats', userId],
    queryFn: () => feedbackService.getStats(),
  })
}
