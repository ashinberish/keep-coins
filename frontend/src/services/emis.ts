import api from "./api"

export interface Installment {
  id: string
  month_number: number
  due_date: string
  amount: number
  is_paid: boolean
}

export interface Emi {
  id: string
  user_id: string
  name: string
  monthly_amount: number
  total_months: number
  start_date: string
  created_at: string
  installments: Installment[]
}

export interface CreateEmiPayload {
  name: string
  monthly_amount: number
  total_months: number
  start_date: string
}

export const emisApi = {
  list: () => api.get<Emi[]>("/emis"),

  create: (data: CreateEmiPayload) => api.post<Emi>("/emis", data),

  update: (id: string, data: { name?: string; monthly_amount?: number }) =>
    api.patch<Emi>(`/emis/${id}`, data),

  delete: (id: string) => api.delete(`/emis/${id}`),

  toggleInstallment: (id: string, is_paid: boolean) =>
    api.patch<Installment>(`/emis/installments/${id}`, { is_paid }),

  updateInstallment: (
    id: string,
    data: { amount?: number; is_paid?: boolean }
  ) => api.patch<Installment>(`/emis/installments/${id}`, data),
}
