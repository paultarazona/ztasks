import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from './useAuthStore'
import * as authService from '../services/authService'

export function useAdmin() {
  const user = useAuthStore((s) => s.user)

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      return authService.checkIsAdmin()
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })

  return {
    isAdmin: isAdmin ?? false,
    role: isAdmin ? 'admin' : null,
    isLoading,
    user,
  }
}
