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
  is_active: boolean
  is_superuser: boolean
  is_email_verified: boolean
  is_onboarded: boolean
  currency: string
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

export const authApi = {
  signup: (data: SignupPayload) => api.post<UserResponse>("/auth/signup", data),

  login: (data: LoginPayload) => api.post<TokenResponse>("/auth/login", data),

  verifyEmail: (data: VerifyEmailPayload) =>
    api.post<TokenResponse>("/auth/verify-email", data),

  resendVerification: (data: ResendCodePayload) =>
    api.post<{ message: string }>("/auth/resend-verification", data),

  getMe: () => api.get<UserResponse>("/auth/me"),

  updateCurrency: (currency: string) =>
    api.patch<UserResponse>("/auth/me/currency", { currency }),

  updateDefaultAccount: (id: string | null) =>
    api.patch<UserResponse>("/auth/me/default-account", {
      default_account_id: id,
    }),

  updateUsername: (username: string) =>
    api.patch<UserResponse>("/auth/me/username", { username }),

  deleteAccount: () => api.delete("/auth/me"),

  completeOnboarding: () =>
    api.post<UserResponse>("/auth/me/onboarding-complete"),
}
