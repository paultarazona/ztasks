import { api, ApiError } from '../lib/apiClient'
import type { AuthUser } from '../hooks/useAuthStore'

export interface SignInResult {
  user: AuthUser | null
}

export interface SignUpResult {
  user: AuthUser | null
  requireEmailVerification?: boolean
}

export interface ProfileData {
  name?: string | null
  avatar_url?: string | null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await api<AuthUser>('GET', '/auth/me')
    return data ?? null
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const data = await api<{ user: AuthUser }>('POST', '/auth/sign-in/email', { email, password })
  return { user: data.user ?? null }
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const name = email.split('@')[0]
  const data = await api<{ user: AuthUser }>('POST', '/auth/sign-up/email', { email, password, name })
  return { user: data.user ?? null, requireEmailVerification: false }
}

export async function verifyOTP(email: string, otp: string): Promise<SignInResult> {
  return api<SignInResult>('POST', '/auth/email-otp/verify-otp', { email, otp })
}

export async function resendOTP(email: string): Promise<void> {
  await api<void>('POST', '/auth/email-otp/send-verification-otp', { email, type: 'sign-in' })
}

export async function signOut(): Promise<void> {
  await api<void>('POST', '/auth/sign-out')
}

export async function signInWithGoogle(): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL as string
  window.location.href = `${baseUrl}/auth/google`
}

export async function setProfile(profile: ProfileData): Promise<ProfileData> {
  return api<ProfileData>('PATCH', '/user-profiles/me', profile)
}

export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const baseUrl = import.meta.env.VITE_API_URL as string
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${baseUrl}/auth/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    let message = `Upload failed with status ${response.status}`
    try {
      const payload = await response.json()
      if (typeof payload?.error === 'string') message = payload.error
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status)
  }

  return response.json() as Promise<{ url: string }>
}

export async function sendResetEmail(email: string): Promise<void> {
  await api<void>('POST', '/auth/reset-password/request', { email })
}

export async function verifyResetToken(email: string, code: string): Promise<{ token: string }> {
  return api<{ token: string }>('POST', '/auth/reset-password/verify', { email, code })
}

export async function resetPassword(newPassword: string, otp: string): Promise<void> {
  await api<void>('POST', '/auth/reset-password/confirm', { newPassword, otp })
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    await api<unknown[]>('GET', '/admin/users')
    return true
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 404)) return false
    throw err
  }
}
