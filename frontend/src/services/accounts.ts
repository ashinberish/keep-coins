import api from "./api"

export type AccountType = "bank" | "cash" | "debit_card" | "credit_card"

export interface Account {
  id: string
  user_id: string
  name: string
  icon: string
  type: AccountType
  linked_account_id: string | null
  credit_limit: number | null
  balance: number
  debt: number
  created_at: string
}

export interface CreateAccountPayload {
  name: string
  icon?: string
  type?: AccountType
  linked_account_id?: string
  credit_limit?: number
  balance?: number
  debt?: number
}

export interface UpdateAccountPayload {
  name?: string
  icon?: string
  type?: AccountType
  linked_account_id?: string | null
  credit_limit?: number | null
  balance?: number
  debt?: number
}

export const accountsApi = {
  list: () => api.get<Account[]>("/accounts"),

  create: (data: CreateAccountPayload) => api.post<Account>("/accounts", data),

  update: (id: string, data: UpdateAccountPayload) =>
    api.put<Account>(`/accounts/${id}`, data),

  delete: (id: string) => api.delete(`/accounts/${id}`),
}
