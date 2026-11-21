'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: number
  username: string
  email: string
  role: string
  full_name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[AuthContext] useEffect mounting to check localStorage')
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    console.log('[AuthContext] storedToken:', !!storedToken)
    console.log('[AuthContext] storedUser:', !!storedUser)

    if (storedToken && storedUser) {
      console.log('[AuthContext] Restoring session from localStorage')
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    } else {
      console.log('[AuthContext] No stored credentials found')
    }
    // Set loading=false in the same effect so user + loading update in one render cycle.
    // This prevents a brief window where loading=false but user=null, which would
    // cause any auth-guarded page to wrongly redirect to login.
    setLoading(false)
    console.log('[AuthContext] Initialization complete, loading=false')
  }, [])

  const login = async (username: string, password: string) => {
    console.log('[AuthContext] Starting login request for:', username)
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[AuthContext] Login failed:', error)
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    console.log('[AuthContext] Login response received, token length:', data.token?.length)
    console.log('[AuthContext] User data:', data.user)

    // Update localStorage first to ensure persistence
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    console.log('[AuthContext] localStorage updated')

    // Then update React state
    setToken(data.token)
    setUser(data.user)
    console.log('[AuthContext] React state updated')
  }

  const logout = () => {
    console.log('[AuthContext] logout called \u2014 userId=%s, username=%s', user?.id, user?.username)
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    console.log('[AuthContext] Session cleared from state and localStorage')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
