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

describe('tasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets tasks by category through apiClient', async () => {
    const tasks = [
      {
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
      },
    ] satisfies Task[]
    apiMock.mockResolvedValueOnce(tasks)

    const { getTasksByCategory } = await import('./tasksService')

    const getTasks = getTasksByCategory as (categoryId: string) => Promise<Task[]>

    await expect(getTasks('category-1')).resolves.toEqual(tasks)
    expect(apiMock).toHaveBeenCalledWith('GET', '/tasks?categoryId=category-1')
  })
})
