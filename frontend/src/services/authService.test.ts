import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerificationEmail: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn(),
      signInWithOAuth: vi.fn(),
      setProfile: vi.fn(),
      sendResetPasswordEmail: vi.fn(),
      exchangeResetPasswordToken: vi.fn(),
      resetPassword: vi.fn(),
    },
    database: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    },
    storage: {
      from: vi.fn().mockReturnThis(),
      uploadAuto: vi.fn(),
    },
  },
}))

import { api } from '../lib/apiClient'

const apiMock = vi.mocked(api)

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCurrentUser calls GET /auth/me and returns the user', async () => {
    const user = { id: 'u1', email: 'test@test.com', name: 'Test' }
    apiMock.mockResolvedValueOnce(user)

    const { getCurrentUser } = await import('./authService')
    const result = await getCurrentUser()

    expect(apiMock).toHaveBeenCalledWith('GET', '/auth/me')
    expect(result).toEqual(user)
  })

  it('signIn calls POST /auth/sign-in/email with email and password', async () => {
    const user = { id: 'u1', email: 'test@test.com', name: 'Test' }
    apiMock.mockResolvedValueOnce({ user })

    const { signIn } = await import('./authService')
    const result = await signIn('test@test.com', 'pass123')

    expect(apiMock).toHaveBeenCalledWith('POST', '/auth/sign-in/email', {
      email: 'test@test.com',
      password: 'pass123',
    })
    expect(result).toEqual({ user })
  })

  it('signOut calls POST /auth/sign-out', async () => {
    apiMock.mockResolvedValueOnce(undefined)

    const { signOut } = await import('./authService')
    await signOut()

    expect(apiMock).toHaveBeenCalledWith('POST', '/auth/sign-out')
  })

  it('signUp calls POST /auth/sign-up/email with name derived from email', async () => {
    const user = { id: 'u1', email: 'test@test.com', name: 'test' }
    apiMock.mockResolvedValueOnce({ user })

    const { signUp } = await import('./authService')
    const result = await signUp('test@test.com', 'pass123')

    expect(apiMock).toHaveBeenCalledWith('POST', '/auth/sign-up/email', {
      email: 'test@test.com',
      password: 'pass123',
      name: 'test',
    })
    expect(result).toEqual({ user, requireEmailVerification: false })
  })

  it('verifyOTP calls POST /auth/email-otp/verify-otp', async () => {
    const user = { id: 'u1', email: 'test@test.com', name: 'Test' }
    apiMock.mockResolvedValueOnce({ user })

    const { verifyOTP } = await import('./authService')
    await verifyOTP('test@test.com', '123456')

    expect(apiMock).toHaveBeenCalledWith('POST', '/auth/email-otp/verify-otp', {
      email: 'test@test.com',
      otp: '123456',
    })
  })

  it('checkIsAdmin returns true on 200', async () => {
    apiMock.mockResolvedValueOnce([{ id: 'u1' }])

    const { checkIsAdmin } = await import('./authService')
    const result = await checkIsAdmin('u1')

    expect(apiMock).toHaveBeenCalledWith('GET', '/admin/users')
    expect(result).toBe(true)
  })

  it('checkIsAdmin returns false on 403 ApiError', async () => {
    apiMock.mockRejectedValueOnce(new ApiError('Forbidden', 403, 'FORBIDDEN'))

    const { checkIsAdmin } = await import('./authService')
    const result = await checkIsAdmin('u1')

    expect(result).toBe(false)
  })
})
