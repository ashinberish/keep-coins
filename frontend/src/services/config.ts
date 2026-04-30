import api from "./api"

export interface AppConfig {
  id: number
  key: string
  value: string
  description: string | null
}

export interface SidebarButtonConfig {
  enabled: boolean
  label: string
  url: string
  variant: string
}

export interface PublicConfig {
  signup_enabled: boolean
  sidebar_button: SidebarButtonConfig | null
}

export const configApi = {
  list: () => api.get<AppConfig[]>("/config"),

  update: (id: number, value: string) =>
    api.patch<AppConfig>(`/config/${id}`, { value }),

  getPublic: () => api.get<PublicConfig>("/config/public"),
}
