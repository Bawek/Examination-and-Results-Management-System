'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { showToast } from '../src/lib/toast'

interface User {
  id: number
  username: string
  email: string
  role: string
  full_name: string
}

interface AuthContextType {
  user: User | null
  currentUser: User | null // Alias for compatibility
  currentRole: string | null // For App.tsx compatibility
  isAuthenticated: boolean // For App.tsx compatibility
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isLoading: boolean // Alias for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    // Set loading=false in the same effect so user + loading update in one render cycle.
    // This prevents a brief window where loading=false but user=null, which would
    // cause any auth-guarded page to wrongly redirect to login.
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      showToast.error(error.error || 'Login failed')
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()

    // Update localStorage first to ensure persistence
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    // Then update React state
    setToken(data.token)
    setUser(data.user)
    showToast.success(`Welcome back, ${data.user.full_name || data.user.username}!`)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    showToast.info('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      currentUser: user, // Alias for App.tsx
      currentRole: user?.role || null, // For App.tsx
      isAuthenticated: !!user, // For App.tsx
      token, 
      login, 
      logout, 
      loading,
      isLoading: loading // Alias for App.tsx
    }}>
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
