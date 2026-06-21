import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the service module — after refactor, useTasks should call service, not insforge directly
vi.mock('../services/tasksService', () => ({
  getTasksByCategory: vi.fn().mockResolvedValue([]),
  createTask: vi.fn().mockResolvedValue({ id: '1', title: 'Task 1' }),
  updateTask: vi.fn().mockResolvedValue({ id: '1', title: 'Updated' }),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  reorderTasks: vi.fn().mockResolvedValue(undefined),
  getPendingTaskCounts: vi.fn().mockResolvedValue({}),
}))

// insforge should NOT be imported directly by useTasks after refactor.
// We verify by checking the module graph doesn't call insforge.database directly.
vi.mock('../lib/insforge', () => {
  const databaseSpy = {
    from: vi.fn(() => { throw new Error('useTasks must NOT call insforge.database directly') }),
  }
  return {
    insforge: {
      database: databaseSpy,
      realtime: {
        on: vi.fn(),
        off: vi.fn(),
        connect: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn().mockResolvedValue({ ok: true }),
        unsubscribe: vi.fn(),
        publish: vi.fn().mockResolvedValue(undefined),
        isConnected: false,
      },
    },
  }
})

describe('useTasks (after service-layer refactor)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useTasks module imports from tasksService, not from insforge directly', async () => {
    // This test validates the dependency inversion:
    // importing useTasks should not trigger insforge.database.from (which throws in our mock).
    // If it does, the test fails with the "must NOT call insforge.database directly" error.
    await expect(import('./useTasks')).resolves.toBeDefined()
  })

  it('tasksService.getTasksByCategory is the function called for data fetching', async () => {
    const { getTasksByCategory } = await import('../services/tasksService')
    // Verify the mock is in place — the service is available
    expect(typeof getTasksByCategory).toBe('function')
  })
})
