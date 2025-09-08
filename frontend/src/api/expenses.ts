import { http } from './http'

export interface Expense {
  id: number
  amount: number
  transactionDate: string
  description?: string
  paymentType?: string
  category?: { id: number; name: string; parentId?: number; parentName?: string }
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

export async function updateExpense(id: number, payload: { 
  amount: number; 
  transactionDate?: string; 
  description?: string; 
  categoryId?: number; 
  tagIds?: number[];
  paymentType?: string;
}) {
  const { data } = await http.put<Expense>(`/expenses/${id}`, payload)
  return data
}

export async function deleteExpense(id: number) {
  await http.delete(`/expenses/${id}`)
}

export async function filterExpenses(params: {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
  tagIds?: number[];
}): Promise<Expense[]> {
  const searchParams = new URLSearchParams()
  
  if (params.startDate) searchParams.append('startDate', params.startDate)
  if (params.endDate) searchParams.append('endDate', params.endDate)
  if (params.categoryIds?.length) {
    params.categoryIds.forEach(id => searchParams.append('categoryIds', id.toString()))
  }
  if (params.tagIds?.length) {
    params.tagIds.forEach(id => searchParams.append('tagIds', id.toString()))
  }

  const { data } = await http.get<Expense[]>(`/expenses/filter?${searchParams.toString()}`)
  return data
}
