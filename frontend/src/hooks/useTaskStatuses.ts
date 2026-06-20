import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from './useAuthStore'
import * as taskStatusesService from '../services/taskStatusesService'
import type { TaskStatus } from '../types'

let globalSeedPending = false

export function useTaskStatuses(categoryId?: string | null) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  const query = useQuery({
    queryKey: ['task_statuses', categoryId ?? 'global', userId],
    queryFn: async () => {
      const globalData = await taskStatusesService.getGlobalStatuses(userId!)

      if (!categoryId) {
        return globalData
      }

      const categoryData = await taskStatusesService.getCategoryStatuses(userId!, categoryId)

      if (categoryData.length > 0) {
        return categoryData
      }

      return globalData
    },
    enabled: !!userId,
  })

  const seedGlobalStatuses = useMutation({
    mutationFn: () => taskStatusesService.seedGlobalStatuses(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_statuses'] })
    },
  })

  useEffect(() => {
    if (
      userId &&
      !query.isLoading &&
      !query.isFetching &&
      !query.isError &&
      query.data &&
      query.data.length === 0 &&
      !globalSeedPending
    ) {
      globalSeedPending = true
      seedGlobalStatuses.mutate(undefined, {
        onSettled: () => { globalSeedPending = false },
      })
    }
  }, [userId, query.isLoading, query.isFetching, query.isError, query.data, seedGlobalStatuses])

  return { ...query, seedGlobalStatuses }
}
