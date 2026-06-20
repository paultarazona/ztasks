import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as authService from '../services/authService'
import { queryClient } from '../lib/queryClient'

export interface AuthUser {
  id: string
  email: string
  profile?: Record<string, unknown> | null
  [key: string]: unknown
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  setAuth: (user: AuthUser | null) => void
  updateProfile: (profile: Record<string, unknown>) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      setAuth: (user) => {
        if (get().user?.id !== user?.id) {
          queryClient.clear()
        }
        set({ user, loading: false, initialized: true })
      },
      updateProfile: (profile) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                profile: {
                  ...(state.user.profile ?? {}),
                  ...profile,
                },
              }
            : null,
        })),
      signOut: async () => {
        await authService.signOut()
        queryClient.clear()
        set({ user: null, loading: false, initialized: true })
      },
      initialize: async () => {
        set({ loading: true })

        try {
          const user = await authService.getCurrentUser()
          if (user) {
            set({ user, loading: false, initialized: true })
            return
          }
        } catch {
          // Session expired or cookie missing — do not trust persisted UI state.
        }

        set({
          user: null,
          loading: false,
          initialized: true,
        })
        queryClient.clear()
      },
    }),
    {
      name: 'taskforge-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
