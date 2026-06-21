import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './useAuthStore'
import * as categoriesService from '../services/categoriesService'
import type { Category } from '../types'

export function useCategories() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  const getCurrentUserId = () => {
    const currentUserId = useAuthStore.getState().user?.id
    if (!currentUserId) throw new Error('User must be authenticated')
    return currentUserId
  }

  const query = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => categoriesService.getCategories(userId!),
    enabled: !!userId,
  })

  const createCategory = useMutation({
    mutationFn: async (input: { name: string; color?: string; parent_id?: string | null; type?: 'folder' | 'list' }) => {
      const currentUserId = getCurrentUserId()
      return categoriesService.createCategory({ ...input, user_id: currentUserId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; color?: string | null; parent_id?: string | null }) => {
      const currentUserId = getCurrentUserId()
      return categoriesService.updateCategory({ id, user_id: currentUserId, ...input })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (input: {
      ids: string[]
      rootId: string
      deletedAs: 'tree' | 'folder' | 'list'
    }) => {
      const currentUserId = getCurrentUserId()
      return categoriesService.deleteCategory({
        ids: input.ids,
        rootId: input.rootId,
        userId: currentUserId,
        deletedAs: input.deletedAs,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['trash-categories'] })
    },
  })

  return { ...query, createCategory, updateCategory, deleteCategory }
}

export function useTrashCategories() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  const getCurrentUserId = () => {
    const currentUserId = useAuthStore.getState().user?.id
    if (!currentUserId) throw new Error('User must be authenticated')
    return currentUserId
  }

  const query = useQuery({
    queryKey: ['trash-categories', userId],
    queryFn: () => categoriesService.getTrashCategories(userId!),
    enabled: !!userId,
  })

  const restoreCategory = useMutation({
    mutationFn: async (ids: string[]) => {
      const currentUserId = getCurrentUserId()
      return categoriesService.restoreCategory(ids, currentUserId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['trash-categories'] })
    },
  })

  const permanentDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const currentUserId = getCurrentUserId()
      return categoriesService.permanentDeleteCategory(ids, currentUserId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['trash-categories'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return { ...query, restoreCategory, permanentDelete }
}

export function buildCategoryTree(categories: Category[]): Category[] {
  type CategoryWithChildren = Category & { children: CategoryWithChildren[] }

  const map = new Map<string, CategoryWithChildren>()
  const roots: CategoryWithChildren[] = []

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] })
  }

  for (const cat of map.values()) {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(cat)
    } else {
      roots.push(cat)
    }
  }

  return roots
}
