import { http } from './http'

export interface SignupForm {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

export async function signup(data: SignupForm): Promise<string> {
  const res = await http.post('/auth/signup', data)
  return res.data.token
}

export interface LoginForm {
  usernameOrEmail: string
  password: string
}

export async function login(data: LoginForm): Promise<string> {
  const res = await http.post('/auth/login', data)
  return res.data.token
}
