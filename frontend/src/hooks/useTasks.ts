import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useAuthStore } from './useAuthStore'
import * as tasksService from '../services/tasksService'
import * as realtimeService from '../services/realtimeService'
import type { Task, Priority } from '../types'
import type { CreateTaskFormData } from '../components/tasks/CreateTaskDialog'

type TaskCountRow = Pick<Task, 'category_id' | 'status_id'>

interface CreateTaskInput {
  title: string
  category_id: string
  status_id: string
  description?: string
  priority?: Priority
  due_date?: string | null
}

interface UpdateTaskInput {
  id: string
  title?: string
  description?: string | null
  priority?: Priority
  status_id?: string
  due_date?: string | null
}

export function useTasks(categoryId?: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const queryKey = useMemo(() => ['tasks', categoryId, userId] as const, [categoryId, userId])

  const getCurrentUserId = () => {
    const currentUserId = useAuthStore.getState().user?.id
    if (!currentUserId) throw new Error('User must be authenticated')
    return currentUserId
  }

  useEffect(() => {
    if (!categoryId || !userId) return

    return realtimeService.subscribeToTaskChannel(userId, categoryId, {
      onTaskCreated: (payload) => {
        const task = payload.task as Task | undefined
        if (!task || task.category_id !== categoryId) return
        queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
        queryClient.setQueryData<Task[]>(queryKey, (current = []) => {
          if (current.some((t) => t.id === task.id)) return current
          return [task, ...current]
        })
      },
      onTaskUpdated: (payload) => {
        const task = payload.task as Task | undefined
        if (!task || task.category_id !== categoryId) return
        queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
        queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
          current.map((t) => (t.id === task.id ? task : t)),
        )
      },
      onTaskDeleted: (payload) => {
        if (!payload.taskId) return
        queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
        queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
          current.filter((t) => t.id !== payload.taskId),
        )
      },
    })
  }, [categoryId, queryClient, queryKey, userId])

  const publishTaskEvent = async (event: string, payload: Record<string, unknown>) => {
    if (!categoryId || !userId) return
    await realtimeService.publishTaskEvent(userId, categoryId, event, payload)
  }

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!categoryId || !userId) return []
      return tasksService.getTasksByCategory(userId, categoryId)
    },
    enabled: !!categoryId && !!userId,
  })

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const currentUserId = getCurrentUserId()
      return tasksService.createTask({ ...input, user_id: currentUserId })
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
      queryClient.setQueryData<Task[]>(queryKey, (current = []) => {
        if (current.some((item) => item.id === task.id)) return current
        return [task, ...current]
      })
      publishTaskEvent('task_created', { task })
    },
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, ...input }: UpdateTaskInput) => {
      const currentUserId = getCurrentUserId()
      return tasksService.updateTask({ id, user_id: currentUserId, ...input })
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)
      queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
        current.map((task) => (task.id === id ? { ...task, ...input } : task)),
      )
      return { previousTasks }
    },
    onError: (_error, _input, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks)
      }
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
      queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
        current.map((item) => (item.id === task.id ? task : item)),
      )
      publishTaskEvent('task_updated', { task })
    },
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const currentUserId = getCurrentUserId()
      await tasksService.deleteTask(id, currentUserId)
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)
      queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
        current.filter((task) => task.id !== id),
      )
      return { previousTasks }
    },
    onError: (_error, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks)
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
      publishTaskEvent('task_deleted', { taskId: id })
    },
  })

  return { ...query, createTask, updateTask, deleteTask }
}

export function toCreateTaskInput(categoryId: string, data: CreateTaskFormData): CreateTaskInput {
  return {
    title: data.title,
    description: data.description,
    priority: data.priority,
    status_id: data.status_id,
    due_date: data.due_date,
    category_id: categoryId,
  }
}

export function usePendingTaskCounts() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['pending-task-counts', userId],
    queryFn: async () => {
      const { tasks, statuses } = await tasksService.getPendingTaskCounts(userId!)

      const completedStatusIds = new Set(
        statuses
          .filter((status) => status.name?.trim().toLocaleLowerCase() === 'completado')
          .map((status) => status.id),
      )

      return (tasks as TaskCountRow[]).reduce<Record<string, number>>(
        (counts, task) => {
          if (completedStatusIds.has(task.status_id)) return counts
          counts[task.category_id] = (counts[task.category_id] ?? 0) + 1
          return counts
        },
        {},
      )
    },
    enabled: !!userId,
  })
}
