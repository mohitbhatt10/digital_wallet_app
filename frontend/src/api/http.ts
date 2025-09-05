import axios from 'axios'

// Prefer VITE_API_URL, then VITE_API_BASE_URL (legacy), then localhost
export const getApiBase = () =>
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  'http://localhost:8080'

export const http = axios.create({
  baseURL: getApiBase(),
  headers: { 'Content-Type': 'application/json' }
})

// Debug: log resolved API base at app startup (helpful in dev)
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('[http] API base resolved to', getApiBase())
}

http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('auth_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
