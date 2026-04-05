import api from "./api"

export interface Expense {
  id: string
  user_id: string
  category_id: string
  amount: string
  type: "expense" | "income"
  description: string | null
  date: string
  created_at: string
  category_name: string | null
  payment_method_id: string | null
  payment_method_name: string | null
}

export interface CreateExpensePayload {
  category_id: string
  amount: number
  type?: "expense" | "income"
  description?: string
  date: string
  payment_method_id?: string
}

export interface PaginatedExpenses {
  items: Expense[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface QuickStats {
  today_total: number
  month_total: number
}

export const expensesApi = {
  list: (
    page = 1,
    pageSize = 10,
    period = "today",
    dateFrom?: string,
    dateTo?: string
  ) =>
    api.get<PaginatedExpenses>("/expenses", {
      params: {
        page,
        page_size: pageSize,
        period,
        ...(dateFrom && dateTo ? { date_from: dateFrom, date_to: dateTo } : {}),
      },
    }),

  quickStats: () => api.get<QuickStats>("/expenses/stats/quick"),

  create: (data: CreateExpensePayload) => api.post<Expense>("/expenses", data),

  update: (id: string, data: Partial<CreateExpensePayload>) =>
    api.put<Expense>(`/expenses/${id}`, data),

  delete: (id: string) => api.delete(`/expenses/${id}`),
}
