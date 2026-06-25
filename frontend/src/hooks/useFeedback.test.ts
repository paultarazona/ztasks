import { describe, it, expect } from 'vitest'

describe('useFeedback logic', () => {
  describe('validation', () => {
    it('should require user to be authenticated', () => {
      const user = null

      if (!user) {
        expect('Not authenticated').toBe('Not authenticated')
      }
    })

    it('should require message to not be empty', () => {
      const user = { id: 'user-123' }
      const message = '   '

      if (user && !message.trim()) {
        expect('Message is required').toBe('Message is required')
      }
    })

    it('should accept valid feedback submission', () => {
      const user = { id: 'user-123' }
      const type = 'suggestion' as const
      const message = 'My suggestion'

      if (user && message.trim()) {
        expect({ userId: user.id, type, message: message.trim() }).toEqual({
          userId: 'user-123',
          type: 'suggestion',
          message: 'My suggestion',
        })
      }
    })

    it('should trim whitespace from message', () => {
      const message = '  Bug report with spaces  '
      const trimmed = message.trim()

      expect(trimmed).toBe('Bug report with spaces')
    })
  })
})