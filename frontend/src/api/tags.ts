import { http } from './http'

export interface Tag { id: number; name: string }

export async function listTags(): Promise<Tag[]> {
  const { data } = await http.get<Tag[]>('/tags')
  return data
}

export async function createTag(payload: { name: string }): Promise<Tag> {
  const { data } = await http.post<Tag>('/tags', payload)
  return data
}
