export type SSEStream = {
  write: (data: string) => void
}

export type SSEEvent = {
  type: string
  payload: unknown
}

/**
 * In-memory SSE channel registry.
 * Maps channel keys (e.g., a userId or category slug) to the set of active
 * streams listening on that channel.
 *
 * Scale note: this is a single-instance, in-memory registry.
 * Horizontal scaling requires a pub/sub broker (e.g., Redis). See Slice 5 notes.
 */
export class SSEManager {
  private readonly channels = new Map<string, Set<SSEStream>>()

  register(channel: string, stream: SSEStream): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)!.add(stream)
  }

  unregister(channel: string, stream: SSEStream): void {
    const streams = this.channels.get(channel)
    if (!streams) return
    streams.delete(stream)
    if (streams.size === 0) {
      this.channels.delete(channel)
    }
  }

  broadcast(channel: string, event: SSEEvent): void {
    const streams = this.channels.get(channel)
    if (!streams) return
    // SSE wire format: named event with separate data line
    const frame = `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`
    for (const stream of streams) {
      stream.write(frame)
    }
  }
}

// Singleton instance shared across the application
export const sseManager = new SSEManager()
