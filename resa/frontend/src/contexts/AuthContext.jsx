import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'
import { getToken, setToken, setUnauthorizedHandler } from '../services/http'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async (callApi = true) => {
    if (callApi && getToken()) {
      try {
        await authApi.logout()
      } catch {
        // Ignore — we clear local state regardless.
      }
    }
    setToken(null)
    setUser(null)
  }, [])

  // Any 401 from the API clears the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null)
      setUser(null)
    })
  }, [])

  // Restore the session on first load if a token is present.
  useEffect(() => {
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const { data } = await authApi.me()
        setUser(data.data ?? data)
      } catch {
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
