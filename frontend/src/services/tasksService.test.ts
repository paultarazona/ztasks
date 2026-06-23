import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '../types'
import { ApiError } from '../lib/errors'

vi.mock('../lib/apiClient', async () => {
  const { ApiError } = await import('../lib/errors')
  return {
    api: vi.fn(),
    ApiError,
  }
})

vi.mock('../lib/insforge', () => ({
  insforge: {
    database: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}))

import { api } from '../lib/apiClient'

const apiMock = vi.mocked(api)

void ApiError // referenced to ensure import is used

const task = {
  id: 'task-1',
  user_id: 'user-1',
  category_id: 'category-1',
  status_id: 'status-1',
  title: 'Task 1',
  description: null,
  priority: 'medium',
  due_date: null,
  created_at: '2026-06-20T00:00:00.000Z',
  updated_at: '2026-06-20T00:00:00.000Z',
} satisfies Task

describe('tasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets tasks by category through apiClient', async () => {
    const tasks = [task] satisfies Task[]
    apiMock.mockResolvedValueOnce(tasks)

    const { getTasksByCategory } = await import('./tasksService')

    const getTasks = getTasksByCategory as (categoryId: string) => Promise<Task[]>

    await expect(getTasks('category-1')).resolves.toEqual(tasks)
    expect(apiMock).toHaveBeenCalledWith('GET', '/tasks?categoryId=category-1')
  })

  it('creates a task through apiClient', async () => {
    apiMock.mockResolvedValueOnce(task)

    const { createTask } = await import('./tasksService')

    await expect(
      createTask({
        category_id: 'category-1',
        status_id: 'status-1',
        title: 'Task 1',
        description: 'Details',
        priority: 'high',
        due_date: null,
      }),
    ).resolves.toEqual(task)
    expect(apiMock).toHaveBeenCalledWith('POST', '/tasks', {
      categoryId: 'category-1',
      statusId: 'status-1',
      title: 'Task 1',
      description: 'Details',
      priority: 'high',
      dueDate: null,
    })
  })

  it('updates a task through apiClient without sending id', async () => {
    apiMock.mockResolvedValueOnce({ ...task, title: 'Updated' })

    const { updateTask } = await import('./tasksService')

    await expect(
      updateTask({ id: 'task-1', title: 'Updated' }),
    ).resolves.toEqual({ ...task, title: 'Updated' })
    expect(apiMock).toHaveBeenCalledWith('PATCH', '/tasks/task-1', { title: 'Updated' })
    // statusId and dueDate are omitted when undefined
  })

  it('deletes a task through apiClient', async () => {
    apiMock.mockResolvedValueOnce(undefined)

    const { deleteTask } = await import('./tasksService')

    await expect(deleteTask('task-1')).resolves.toBeUndefined()
    expect(apiMock).toHaveBeenCalledWith('DELETE', '/tasks/task-1')
  })

  it('reorders tasks through apiClient', async () => {
    apiMock.mockResolvedValue(undefined)

    const { reorderTasks } = await import('./tasksService')

    await expect(
      reorderTasks([
        { id: 'task-1', position: 1 },
        { id: 'task-2', position: 2 },
      ]),
    ).resolves.toBeUndefined()
    expect(apiMock).toHaveBeenNthCalledWith(1, 'PATCH', '/tasks/task-1/reorder', { position: 1 })
    expect(apiMock).toHaveBeenNthCalledWith(2, 'PATCH', '/tasks/task-2/reorder', { position: 2 })
  })

  it('createTask propagates ApiError on failure', async () => {
    apiMock.mockRejectedValueOnce(new ApiError('Unauthorized', 401, 'UNAUTHORIZED'))

    const { createTask } = await import('./tasksService')

    await expect(
      createTask({
        category_id: 'cat-1',
        status_id: 'status-1',
        title: 'Fail task',
      }),
    ).rejects.toThrow('Unauthorized')
  })

  it('getPendingTaskCounts calls GET /tasks/pending-counts', async () => {
    const counts = { 1: 3, 2: 1 }
    apiMock.mockResolvedValueOnce(counts)

    const { getPendingTaskCounts } = await import('./tasksService')
    const result = await getPendingTaskCounts()

    expect(apiMock).toHaveBeenCalledWith('GET', '/tasks/pending-counts')
    expect(result).toEqual(counts)
  })
})
