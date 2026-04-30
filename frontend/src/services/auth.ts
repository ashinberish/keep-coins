import api from "./api"

export interface SignupPayload {
  email: string
  username: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserResponse {
  id: string
  email: string
  username: string
  full_name: string | null
  is_active: boolean
  is_superuser: boolean
  is_email_verified: boolean
  is_onboarded: boolean
  currency: string
  theme: string
  default_account_id: string | null
  created_at: string
}

export interface VerifyEmailPayload {
  email: string
  code: string
}

export interface ResendCodePayload {
  email: string
}

export interface CheckUsernameResponse {
  available: boolean
  suggestions: string[]
}

export const authApi = {
  signup: (data: SignupPayload) => api.post<UserResponse>("/auth/signup", data),

  login: (data: LoginPayload) => api.post<TokenResponse>("/auth/login", data),

  verifyEmail: (data: VerifyEmailPayload) =>
    api.post<TokenResponse>("/auth/verify-email", data),

  resendVerification: (data: ResendCodePayload) =>
    api.post<{ message: string }>("/auth/resend-verification", data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }),

  resetPassword: (email: string, code: string, new_password: string) =>
    api.post<{ message: string }>("/auth/reset-password", {
      email,
      code,
      new_password,
    }),

  getMe: () => api.get<UserResponse>("/auth/me"),

  updateCurrency: (currency: string) =>
    api.patch<UserResponse>("/auth/me/currency", { currency }),

  updateDefaultAccount: (id: string | null) =>
    api.patch<UserResponse>("/auth/me/default-account", {
      default_account_id: id,
    }),

  updateUsername: (username: string) =>
    api.patch<UserResponse>("/auth/me/username", { username }),

  updateName: (full_name: string) =>
    api.patch<UserResponse>("/auth/me/name", { full_name }),

  checkUsername: (username: string) =>
    api.get<CheckUsernameResponse>(
      `/auth/check-username/${encodeURIComponent(username)}`
    ),

  updateTheme: (theme: string) =>
    api.patch<UserResponse>("/auth/me/theme", { theme }),

  deleteAccount: () => api.delete("/auth/me"),

  completeOnboarding: () =>
    api.post<UserResponse>("/auth/me/onboarding-complete"),
}
