import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as realtimeService from '../services/realtimeService'

export function useRealtimeFeedback() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    }

    return realtimeService.subscribeToFeedbackChannel({
      onInsert: invalidate,
      onUpdate: invalidate,
      onDelete: invalidate,
    })
  }, [queryClient])
}
