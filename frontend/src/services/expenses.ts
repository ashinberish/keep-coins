import api from "./api"

export interface Expense {
  id: string
  user_id: string
  category_id: string
  amount: string
  description: string | null
  date: string
  created_at: string
  category_name: string | null
}

export interface CreateExpensePayload {
  category_id: string
  amount: number
  description?: string
  date: string
}

export interface PaginatedExpenses {
  items: Expense[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export const expensesApi = {
  list: (page = 1, pageSize = 10) =>
    api.get<PaginatedExpenses>("/expenses", {
      params: { page, page_size: pageSize },
    }),

  create: (data: CreateExpensePayload) => api.post<Expense>("/expenses", data),

  update: (id: string, data: Partial<CreateExpensePayload>) =>
    api.put<Expense>(`/expenses/${id}`, data),

  delete: (id: string) => api.delete(`/expenses/${id}`),
}
