import axios from 'axios'

const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080'

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('auth_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
