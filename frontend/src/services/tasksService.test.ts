import { describe, it, expect, vi, beforeEach } from 'vitest'

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
      in: vi.fn().mockReturnThis(),
    },
  },
}))

describe('tasksService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('exports getTasksByCategory function', async () => {
    const mod = await import('./tasksService')
    expect(typeof mod.getTasksByCategory).toBe('function')
  })

  it('exports createTask function', async () => {
    const mod = await import('./tasksService')
    expect(typeof mod.createTask).toBe('function')
  })

  it('exports updateTask function', async () => {
    const mod = await import('./tasksService')
    expect(typeof mod.updateTask).toBe('function')
  })

  it('exports deleteTask function', async () => {
    const mod = await import('./tasksService')
    expect(typeof mod.deleteTask).toBe('function')
  })

  it('exports reorderTasks function', async () => {
    const mod = await import('./tasksService')
    expect(typeof mod.reorderTasks).toBe('function')
  })

  it('exports getPendingTaskCounts function', async () => {
    const mod = await import('./tasksService')
    expect(typeof mod.getPendingTaskCounts).toBe('function')
  })
})
