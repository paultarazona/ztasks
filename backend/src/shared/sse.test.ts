import { describe, it, expect, vi } from 'vitest'
import { SSEManager } from './sse'

function makeStream() {
  return { write: vi.fn() }
}

describe('SSEManager.broadcast', () => {
  it('calls write on all registered streams for the target channel', () => {
    const manager = new SSEManager()
    const s1 = makeStream()
    const s2 = makeStream()
    manager.register('user-1', s1 as never)
    manager.register('user-1', s2 as never)

    manager.broadcast('user-1', { type: 'task_created', payload: { id: 1 } })

    expect(s1.write).toHaveBeenCalledOnce()
    expect(s2.write).toHaveBeenCalledOnce()
  })

  it('does NOT call write on streams registered to a different channel', () => {
    const manager = new SSEManager()
    const target = makeStream()
    const other = makeStream()
    manager.register('user-1', target as never)
    manager.register('user-2', other as never)

    manager.broadcast('user-1', { type: 'task_updated', payload: { id: 2 } })

    expect(target.write).toHaveBeenCalledOnce()
    expect(other.write).not.toHaveBeenCalled()
  })

  it('broadcasts nothing when channel has no registered streams', () => {
    const manager = new SSEManager()
    // No-op — should not throw
    expect(() =>
      manager.broadcast('empty-channel', { type: 'task_deleted', payload: { id: 3 } })
    ).not.toThrow()
  })

  it('does not call write for unregistered streams after unregister', () => {
    const manager = new SSEManager()
    const stream = makeStream()
    manager.register('user-1', stream as never)
    manager.unregister('user-1', stream as never)

    manager.broadcast('user-1', { type: 'task_created', payload: { id: 4 } })

    expect(stream.write).not.toHaveBeenCalled()
  })
})
