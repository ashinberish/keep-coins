import api from "./api"

export interface PaymentMethod {
  id: string
  user_id: string
  name: string
  icon: string
  balance: number
  debt: number
  created_at: string
}

export interface CreatePaymentMethodPayload {
  name: string
  icon?: string
  balance?: number
  debt?: number
}

export interface UpdatePaymentMethodPayload {
  name?: string
  icon?: string
  balance?: number
  debt?: number
}

export const paymentMethodsApi = {
  list: () => api.get<PaymentMethod[]>("/payment-methods"),

  create: (data: CreatePaymentMethodPayload) =>
    api.post<PaymentMethod>("/payment-methods", data),

  update: (id: string, data: UpdatePaymentMethodPayload) =>
    api.put<PaymentMethod>(`/payment-methods/${id}`, data),

  delete: (id: string) => api.delete(`/payment-methods/${id}`),
}
