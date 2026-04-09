import api from "./api"

export interface Expense {
  id: string
  user_id: string
  category_id: string | null
  amount: string
  type: "expense" | "income" | "transfer"
  description: string | null
  date: string
  created_at: string
  category_name: string | null
  account_id: string | null
  account_name: string | null
  transfer_to_account_id: string | null
  transfer_to_account_name: string | null
}

export interface CreateExpensePayload {
  category_id?: string
  amount: number
  type?: "expense" | "income" | "transfer"
  description?: string
  date: string
  account_id?: string
  transfer_to_account_id?: string
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
  today_income: number
  month_income: number
}

export const expensesApi = {
  list: (
    page = 1,
    pageSize = 10,
    period = "all",
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
