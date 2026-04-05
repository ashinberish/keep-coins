import api from "./api"

export interface PaymentMethod {
  id: string
  user_id: string
  name: string
  icon: string
  created_at: string
}

export interface CreatePaymentMethodPayload {
  name: string
  icon?: string
}

export const paymentMethodsApi = {
  list: () => api.get<PaymentMethod[]>("/payment-methods"),

  create: (data: CreatePaymentMethodPayload) =>
    api.post<PaymentMethod>("/payment-methods", data),

  delete: (id: string) => api.delete(`/payment-methods/${id}`),
}
