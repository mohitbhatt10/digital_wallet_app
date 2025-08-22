import { http } from './http'

export interface Category {
  id: number
  name: string
  parent?: Category
  children?: Category[]
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await http.get<Category[]>('/categories')
  return data
}

export async function createCategory(payload: { name: string; parentId?: number }): Promise<Category> {
  const { data } = await http.post<Category>('/categories', payload)
  return data
}
