import api from "./api"

export interface Category {
  id: string
  name: string
  emoji: string
  description: string | null
  category_type: "expense" | "income"
  user_id: string | null
  created_at: string
}

export interface CreateCategoryPayload {
  name: string
  emoji?: string
  description?: string
  category_type?: "expense" | "income"
}

export const categoriesApi = {
  list: () => api.get<Category[]>("/categories"),

  create: (data: CreateCategoryPayload) =>
    api.post<Category>("/categories", data),

  delete: (id: string) => api.delete(`/categories/${id}`),
}
