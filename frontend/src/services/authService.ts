/**
 * authService — Slice 1 stub.
 * Forwards to InsForge internally. Slice 4 will replace with real apiClient calls.
 */
import { insforge } from '../lib/insforge'
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

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await insforge.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { user: (data?.user ?? null) as AuthUser | null }
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await insforge.auth.signUp({ email, password })
  if (error) throw error
  return {
    user: (data?.user ?? null) as AuthUser | null,
    requireEmailVerification: data?.requireEmailVerification ?? false,
  }
}

export async function verifyOTP(email: string, otp: string): Promise<SignInResult> {
  const { data, error } = await insforge.auth.verifyEmail({ email, otp })
  if (error) throw error
  return { user: (data?.user ?? null) as AuthUser | null }
}

export async function resendOTP(email: string): Promise<void> {
  await insforge.auth.resendVerificationEmail({ email })
}

export async function signOut(): Promise<void> {
  await insforge.auth.signOut()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await insforge.auth.getCurrentUser()
  return (data?.user ?? null) as AuthUser | null
}

export async function signInWithGoogle(redirectTo: string): Promise<void> {
  await insforge.auth.signInWithOAuth({ provider: 'google', redirectTo })
}

export async function setProfile(profile: ProfileData): Promise<ProfileData> {
  const { data, error } = await insforge.auth.setProfile({
    name: profile.name ?? null,
    avatar_url: profile.avatar_url ?? null,
  })
  if (error) throw error
  return (data ?? profile) as ProfileData
}

export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const { data, error } = await insforge.storage.from('avatars').uploadAuto(file)
  if (error) throw error
  return { url: data!.url }
}

export async function sendResetEmail(email: string, redirectTo: string): Promise<void> {
  const { error } = await insforge.auth.sendResetPasswordEmail({ email, redirectTo })
  if (error) throw error
}

export async function verifyResetToken(email: string, code: string): Promise<{ token: string }> {
  const { data, error } = await insforge.auth.exchangeResetPasswordToken({ email, code })
  if (error) throw error
  return { token: data!.token }
}

export async function resetPassword(newPassword: string, otp: string): Promise<void> {
  const { error } = await insforge.auth.resetPassword({ newPassword, otp })
  if (error) throw error
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data } = await insforge.database
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}
