import api from "./api"

export interface GroupMember {
  id: string
  user_id: string
  username: string
  email: string
  role: "admin" | "member"
  joined_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  icon: string
  created_by: string
  created_at: string
  members: GroupMember[]
}

export interface SplitItem {
  user_id: string
  amount: number
}

export interface GroupExpenseSplit {
  id: string
  user_id: string
  username: string
  amount: number
  is_settled: boolean
}

export interface GroupExpense {
  id: string
  group_id: string
  paid_by: string
  paid_by_username: string
  amount: number
  description: string
  date: string
  split_type: "equal" | "custom"
  created_at: string
  splits: GroupExpenseSplit[]
}

export interface Settlement {
  id: string
  group_id: string
  paid_by: string
  paid_by_username: string
  paid_to: string
  paid_to_username: string
  amount: number
  date: string
  created_at: string
}

export interface BalanceEntry {
  user_id: string
  username: string
  balance: number
}

export const groupsApi = {
  // Groups
  list: () => api.get<Group[]>("/groups"),
  create: (data: { name: string; description?: string; icon?: string }) =>
    api.post<Group>("/groups", data),
  get: (id: string) => api.get<Group>(`/groups/${id}`),
  update: (
    id: string,
    data: { name?: string; description?: string; icon?: string }
  ) => api.patch<Group>(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),

  // Members
  addMember: (groupId: string, username: string) =>
    api.post<Group>(`/groups/${groupId}/members`, { username }),
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  updateMemberRole: (groupId: string, userId: string, role: string) =>
    api.patch<GroupMember>(`/groups/${groupId}/members/${userId}`, { role }),

  // Expenses
  listExpenses: (groupId: string) =>
    api.get<GroupExpense[]>(`/groups/${groupId}/expenses`),
  createExpense: (
    groupId: string,
    data: {
      amount: number
      description: string
      date: string
      split_type?: string
      splits?: SplitItem[]
    }
  ) => api.post<GroupExpense>(`/groups/${groupId}/expenses`, data),
  deleteExpense: (groupId: string, expenseId: string) =>
    api.delete(`/groups/${groupId}/expenses/${expenseId}`),

  // Settlements
  listSettlements: (groupId: string) =>
    api.get<Settlement[]>(`/groups/${groupId}/settlements`),
  createSettlement: (
    groupId: string,
    data: { paid_to: string; amount: number; date: string }
  ) => api.post<Settlement>(`/groups/${groupId}/settlements`, data),
  deleteSettlement: (groupId: string, settlementId: string) =>
    api.delete(`/groups/${groupId}/settlements/${settlementId}`),

  // Balances
  getBalances: (groupId: string) =>
    api.get<BalanceEntry[]>(`/groups/${groupId}/balances`),
}
