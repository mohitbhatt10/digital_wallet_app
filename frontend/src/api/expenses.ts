import { http } from './http'

export interface Expense {
  id: number
  amount: number
  date: string
  description?: string
  category?: { id: number; name: string }
  tags?: { id: number; name: string }[]
}

export async function listRecentExpenses(): Promise<Expense[]> {
  const { data } = await http.get<Expense[]>('/expenses')
  return data
}

export async function createExpense(payload: { amount: number; date?: string; description?: string; categoryId?: number; tagIds?: number[] }) {
  const { data } = await http.post<Expense>('/expenses', payload)
  return data
}
