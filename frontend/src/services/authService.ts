/**
 * authService — real implementation using apiClient.
 * Slice 4: replaced InsForge stubs with direct apiClient calls.
 */
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
  return api<SignInResult>('POST', '/auth/login', { email, password })
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  return api<SignUpResult>('POST', '/auth/register', { email, password })
}

export async function verifyOTP(email: string, otp: string): Promise<SignInResult> {
  return api<SignInResult>('POST', '/auth/verify-email', { email, otp })
}

export async function resendOTP(email: string): Promise<void> {
  await api<void>('POST', '/auth/resend-otp', { email })
}

export async function signOut(): Promise<void> {
  await api<void>('POST', '/auth/logout')
}

export async function signInWithGoogle(_redirectTo: string): Promise<void> {
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

export async function sendResetEmail(email: string, _redirectTo: string): Promise<void> {
  await api<void>('POST', '/auth/reset-password/request', { email })
}

export async function verifyResetToken(email: string, code: string): Promise<{ token: string }> {
  return api<{ token: string }>('POST', '/auth/reset-password/verify', { email, code })
}

export async function resetPassword(newPassword: string, otp: string): Promise<void> {
  await api<void>('POST', '/auth/reset-password/confirm', { newPassword, otp })
}

export async function checkIsAdmin(_userId: string): Promise<boolean> {
  try {
    await api<unknown[]>('GET', '/admin/users')
    return true
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return false
    throw err
  }
}
