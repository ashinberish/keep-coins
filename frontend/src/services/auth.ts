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
  currency: string
  created_at: string
}

export const authApi = {
  signup: (data: SignupPayload) => api.post<UserResponse>("/auth/signup", data),

  login: (data: LoginPayload) => api.post<TokenResponse>("/auth/login", data),

  getMe: () => api.get<UserResponse>("/auth/me"),

  updateCurrency: (currency: string) =>
    api.patch<UserResponse>("/auth/me/currency", { currency }),
}
