import { http } from './http'

export interface Expense {
  id: number
  amount: number
  transactionDate: string
  description?: string
  paymentType?: string
  category?: { id: number; name: string }
  tags?: { id: number; name: string }[]
}

export async function listRecentExpenses(): Promise<Expense[]> {
  const { data } = await http.get<Expense[]>('/expenses')
  return data
}

export async function createExpense(payload: { 
  amount: number; 
  transactionDate?: string; 
  description?: string; 
  categoryId?: number; 
  tagIds?: number[];
  paymentType?: string;
}) {
  const { data } = await http.post<Expense>('/expenses', payload)
  return data
}
