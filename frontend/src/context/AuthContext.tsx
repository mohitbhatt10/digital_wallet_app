import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { http } from '../api/http'

export interface UserProfile {
  id: number
  username: string
  firstName?: string
  lastName?: string
  email: string
}

interface AuthState {
  user: UserProfile | null
  loading: boolean
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    setLoading(true)
    const token = localStorage.getItem('auth_token')
    if (!token) { setUser(null); setLoading(false); return }
    try {
      const res = await http.get('/users/me')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMe() }, [])

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
