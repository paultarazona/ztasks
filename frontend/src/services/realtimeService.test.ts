import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock EventSource
// ---------------------------------------------------------------------------

type MockESHandler = ((event: MessageEvent) => void) | null

interface MockEventSourceInstance {
  url: string
  withCredentials: boolean
  readyState: number
  close: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  /** Test helper: fire a named event */
  emit: (type: string, data: unknown) => void
}

const instances: MockEventSourceInstance[] = []

class MockEventSource {
  url: string
  withCredentials: boolean
  readyState = 0
  close = vi.fn()
  private listeners: Record<string, ((e: MessageEvent) => void)[]> = {}

  addEventListener = vi.fn((type: string, handler: (e: MessageEvent) => void) => {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(handler)
  })

  removeEventListener = vi.fn()

  emit(type: string, data: unknown) {
    const handlers = this.listeners[type] ?? []
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    handlers.forEach((h) => h(event))
  }

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url
    this.withCredentials = options?.withCredentials ?? false
    instances.push(this as unknown as MockEventSourceInstance)
  }

  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2
}

vi.stubGlobal('EventSource', MockEventSource)

// ---------------------------------------------------------------------------
// Import AFTER stubbing global
// ---------------------------------------------------------------------------

import {
  subscribeToTaskChannel,
  subscribeToFeedbackChannel,
  subscribe,
} from './realtimeService'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('subscribeToTaskChannel', () => {
  beforeEach(() => {
    instances.length = 0
    vi.clearAllMocks()
  })

  it('constructs EventSource at VITE_API_URL/realtime/tasks/:categoryId with credentials', () => {
    const cleanup = subscribeToTaskChannel('user1', 'cat42', {})
    expect(instances).toHaveLength(1)
    expect(instances[0].url).toBe('http://localhost:3000/realtime/tasks/cat42')
    expect(instances[0].withCredentials).toBe(true)
    cleanup()
  })

  it('calls onTaskCreated with parsed payload when task_created event fires', () => {
    const onTaskCreated = vi.fn()
    const cleanup = subscribeToTaskChannel('user1', 'cat42', { onTaskCreated })

    const es = instances[0]
    const payload = { task: { id: '1', title: 'Test task' } }
    es.emit('task_created', payload)

    expect(onTaskCreated).toHaveBeenCalledWith(payload)
    cleanup()
  })

  it('calls onTaskUpdated with parsed payload when task_updated event fires', () => {
    const onTaskUpdated = vi.fn()
    const cleanup = subscribeToTaskChannel('user1', 'cat42', { onTaskUpdated })

    const es = instances[0]
    const payload = { task: { id: '1', title: 'Updated' } }
    es.emit('task_updated', payload)

    expect(onTaskUpdated).toHaveBeenCalledWith(payload)
    cleanup()
  })

  it('calls onTaskDeleted with parsed payload when task_deleted event fires', () => {
    const onTaskDeleted = vi.fn()
    const cleanup = subscribeToTaskChannel('user1', 'cat42', { onTaskDeleted })

    const es = instances[0]
    const payload = { taskId: 'abc-123' }
    es.emit('task_deleted', payload)

    expect(onTaskDeleted).toHaveBeenCalledWith(payload)
    cleanup()
  })

  it('cleanup function calls es.close()', () => {
    const cleanup = subscribeToTaskChannel('user1', 'cat42', {})
    const es = instances[0]
    cleanup()
    expect(es.close).toHaveBeenCalledOnce()
  })
})

describe('subscribeToFeedbackChannel', () => {
  beforeEach(() => {
    instances.length = 0
    vi.clearAllMocks()
  })

  it('constructs EventSource at VITE_API_URL/realtime/feedback with credentials', () => {
    const cleanup = subscribeToFeedbackChannel({})
    expect(instances).toHaveLength(1)
    expect(instances[0].url).toBe('http://localhost:3000/realtime/feedback')
    expect(instances[0].withCredentials).toBe(true)
    cleanup()
  })

  it('calls onInsert when feedback_created event fires', () => {
    const onInsert = vi.fn()
    const cleanup = subscribeToFeedbackChannel({ onInsert })

    const es = instances[0]
    es.emit('feedback_created', { id: 1 })

    expect(onInsert).toHaveBeenCalledOnce()
    cleanup()
  })

  it('cleanup function calls es.close()', () => {
    const cleanup = subscribeToFeedbackChannel({})
    const es = instances[0]
    cleanup()
    expect(es.close).toHaveBeenCalledOnce()
  })
})

describe('subscribe (generic)', () => {
  beforeEach(() => {
    instances.length = 0
    vi.clearAllMocks()
  })

  it('constructs EventSource at VITE_API_URL/realtime/:channel with credentials', () => {
    const cleanup = subscribe('my-channel', {})
    expect(instances).toHaveLength(1)
    expect(instances[0].url).toBe('http://localhost:3000/realtime/my-channel')
    cleanup()
  })

  it('calls onMessage handler when message event fires', () => {
    const onMessage = vi.fn()
    const cleanup = subscribe('my-channel', { onMessage })

    const es = instances[0]
    es.emit('message', { hello: 'world' })

    expect(onMessage).toHaveBeenCalledWith({ hello: 'world' })
    cleanup()
  })

  it('cleanup function calls es.close()', () => {
    const cleanup = subscribe('my-channel', {})
    const es = instances[0]
    cleanup()
    expect(es.close).toHaveBeenCalledOnce()
  })
})
