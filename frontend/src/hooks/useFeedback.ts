import { useState } from 'react'
import * as feedbackService from '../services/feedbackService'
import { useAuthStore } from '../hooks/useAuthStore'

interface FeedbackPayload {
  type: 'feedback' | 'suggestion' | 'bug'
  message: string
}

export function useFeedback() {
  const [isLoading, setIsLoading] = useState(false)
  const user = useAuthStore((s) => s.user)

  const submit = async ({ type, message }: FeedbackPayload) => {
    if (!user?.id) return { error: 'Not authenticated' }
    if (!message.trim()) return { error: 'Message is required' }

    setIsLoading(true)
    try {
      await feedbackService.submitFeedback({ user_id: user.id, type, message: message.trim() })
      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Submission failed' }
    } finally {
      setIsLoading(false)
    }
  }

  return { submit, isLoading }
}
