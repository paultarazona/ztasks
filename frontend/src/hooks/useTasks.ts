import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useAuthStore } from './useAuthStore'
import * as tasksService from '../services/tasksService'
import * as realtimeService from '../services/realtimeService'
import type { Task, Priority } from '../types'
import type { CreateTaskFormData } from '../components/tasks/CreateTaskDialog'

interface CreateTaskInput {
  title: string
  categoryId: string
  statusId: string
  description?: string
  priority?: Priority
  dueDate?: string | null
}

interface UpdateTaskInput {
  id: string
  title?: string
  description?: string | null
  priority?: Priority
  statusId?: string
  dueDate?: string | null
}

export function useTasks(categoryId?: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const queryKey = useMemo(() => ['tasks', categoryId, userId] as const, [categoryId, userId])

  useEffect(() => {
    if (!categoryId || !userId) return

    return realtimeService.subscribeToTaskChannel(userId, categoryId, {
      onTaskCreated: (payload) => {
        const task = payload as Task
        if (String(task.categoryId) !== categoryId) return
        queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
        queryClient.setQueryData<Task[]>(queryKey, (current = []) => {
          if (current.some((t) => t.id === task.id)) return current
          return [task, ...current]
        })
      },
      onTaskUpdated: (payload) => {
        const task = payload as Task
        if (String(task.categoryId) !== categoryId) return
        queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
        queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
          current.map((t) => (t.id === task.id ? task : t)),
        )
      },
      onTaskDeleted: (payload) => {
        const { id } = payload as { id: string }
        if (!id) return
        queryClient.invalidateQueries({ queryKey: ['pending-task-counts'] })
        queryClient.setQueryData<Task[]>(queryKey, (current = []) =>
          current.filter((t) => t.id !== id),
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
      return tasksService.getTasksByCategory(categoryId)
    },
    enabled: !!categoryId && !!userId,
  })

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      return tasksService.createTask(input)
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
      return tasksService.updateTask({ id, ...input })
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
      await tasksService.deleteTask(id)
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
    statusId: data.statusId,
    dueDate: data.dueDate,
    categoryId: categoryId,
  }
}

export function usePendingTaskCounts() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['pending-task-counts', userId],
    queryFn: () => tasksService.getPendingTaskCounts(),
    enabled: !!userId,
  })
}
