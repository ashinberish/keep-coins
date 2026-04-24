import { authApi, type UserResponse } from "@/services/auth"
import { create } from "zustand"

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  pendingVerificationEmail: string | null

  login: (email: string, password: string) => Promise<void>
  signup: (email: string, username: string, password: string) => Promise<void>
  verifyEmail: (email: string, code: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  clearError: () => void
  setPendingVerificationEmail: (email: string | null) => void
  setCurrency: (currency: string) => Promise<void>
  setDefaultAccount: (id: string | null) => Promise<void>
  updateUsername: (username: string) => Promise<void>
  deleteAccount: () => Promise<void>
  completeOnboarding: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: false,
  error: null,
  pendingVerificationEmail: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authApi.login({ email, password })
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)

      const { data: user } = await authApi.getMe()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      const message =
        err.response?.data?.detail ?? "Login failed. Please try again."
      const isUnverified =
        err.response?.status === 403 && message.includes("Email not verified")
      if (isUnverified) {
        set({
          error: null,
          isLoading: false,
          pendingVerificationEmail: email,
        })
      } else {
        set({ error: message, isLoading: false })
      }
      throw err
    }
  },

  signup: async (email, username, password) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.signup({ email, username, password })
      set({ isLoading: false, pendingVerificationEmail: email })
    } catch (err: any) {
      const message =
        err.response?.data?.detail ?? "Signup failed. Please try again."
      set({ error: message, isLoading: false })
      throw err
    }
  },

  verifyEmail: async (email, code) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authApi.verifyEmail({ email, code })
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)

      const { data: user } = await authApi.getMe()
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        pendingVerificationEmail: null,
      })
    } catch (err: any) {
      const message =
        err.response?.data?.detail ?? "Verification failed. Please try again."
      set({ error: message, isLoading: false })
      throw err
    }
  },

  resendVerification: async (email) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.resendVerification({ email })
      set({ isLoading: false })
    } catch (err: any) {
      const message =
        err.response?.data?.detail ?? "Failed to resend code. Please try again."
      set({ error: message, isLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const { data } = await authApi.getMe()
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setCurrency: async (currency) => {
    const { data } = await authApi.updateCurrency(currency)
    set({ user: data })
  },

  setDefaultAccount: async (id) => {
    const { data } = await authApi.updateDefaultAccount(id)
    set({ user: data })
  },

  updateUsername: async (username) => {
    const { data } = await authApi.updateUsername(username)
    set({ user: data })
  },

  deleteAccount: async () => {
    await authApi.deleteAccount()
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    set({ user: null, isAuthenticated: false })
  },

  completeOnboarding: async () => {
    const { data } = await authApi.completeOnboarding()
    set({ user: data })
  },

  setPendingVerificationEmail: (email) =>
    set({ pendingVerificationEmail: email }),

  clearError: () => set({ error: null }),
}))
