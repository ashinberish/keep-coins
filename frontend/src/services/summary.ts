import api from "./api"

export interface CategorySummary {
  name: string
  emoji: string
  total: number
  count: number
}

export interface DailySummary {
  date: string
  total: number
}

export interface MonthlySummary {
  year: number
  month: number
  total: number
  income_total: number
  count: number
  by_category: CategorySummary[]
  daily: DailySummary[]
}

export const summaryApi = {
  monthly: (year?: number, month?: number) =>
    api.get<MonthlySummary>("/summary/monthly", {
      params: { ...(year && { year }), ...(month && { month }) },
    }),
}
