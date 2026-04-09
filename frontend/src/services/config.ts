import api from "./api"

export interface AppConfig {
  id: number
  key: string
  value: string
  description: string | null
}

export const configApi = {
  list: () => api.get<AppConfig[]>("/config"),

  update: (id: number, value: string) =>
    api.patch<AppConfig>(`/config/${id}`, { value }),
}
