import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Task } from '../types'
import { api } from '../lib/apiClient'

vi.mock('../lib/apiClient', () => ({
  api: vi.fn(),
}))

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

const apiMock = vi.mocked(api)

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

  it('creates a task through apiClient without sending user_id', async () => {
    apiMock.mockResolvedValueOnce(task)

    const { createTask } = await import('./tasksService')

    await expect(
      createTask({
        user_id: 'user-1',
        category_id: 'category-1',
        status_id: 'status-1',
        title: 'Task 1',
        description: 'Details',
        priority: 'high',
        due_date: null,
      }),
    ).resolves.toEqual(task)
    expect(apiMock).toHaveBeenCalledWith('POST', '/tasks', {
      category_id: 'category-1',
      status_id: 'status-1',
      title: 'Task 1',
      description: 'Details',
      priority: 'high',
      due_date: null,
    })
  })

  it('updates a task through apiClient without sending id or user_id', async () => {
    apiMock.mockResolvedValueOnce({ ...task, title: 'Updated' })

    const { updateTask } = await import('./tasksService')

    await expect(
      updateTask({ id: 'task-1', user_id: 'user-1', title: 'Updated' }),
    ).resolves.toEqual({ ...task, title: 'Updated' })
    expect(apiMock).toHaveBeenCalledWith('PATCH', '/tasks/task-1', { title: 'Updated' })
  })

  it('deletes a task through apiClient', async () => {
    apiMock.mockResolvedValueOnce(undefined)

    const { deleteTask } = await import('./tasksService')

    await expect(deleteTask('task-1', 'user-1')).resolves.toBeUndefined()
    expect(apiMock).toHaveBeenCalledWith('DELETE', '/tasks/task-1')
  })

  it('reorders tasks through apiClient', async () => {
    apiMock.mockResolvedValue(undefined)

    const { reorderTasks } = await import('./tasksService')

    await expect(
      reorderTasks('user-1', [
        { id: 'task-1', position: 1 },
        { id: 'task-2', position: 2 },
      ]),
    ).resolves.toBeUndefined()
    expect(apiMock).toHaveBeenNthCalledWith(1, 'PATCH', '/tasks/task-1/reorder', { position: 1 })
    expect(apiMock).toHaveBeenNthCalledWith(2, 'PATCH', '/tasks/task-2/reorder', { position: 2 })
  })
})
