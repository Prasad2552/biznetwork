
//src\contex\auth-context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

// Define the context type explicitly
interface AuthContextType {
  user: { id: string; email: string; name: string; role: string } | null
  token: string | null
  isLoggedIn: boolean
  login: (user: { id: string; email: string; name: string; role: string }, token: string) => void
  logout: () => void
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        role: session.user.role || 'user',
      })
      setIsLoggedIn(true)
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setToken(storedToken)
      }
    } else {
      setUser(null)
      setIsLoggedIn(false)
      setToken(null)
      localStorage.removeItem('token')
    }
  }, [session, status])

  const login = (userData: { id: string; email: string; name: string; role: string }, authToken: string) => {
    setUser(userData)
    setToken(authToken)
    setIsLoggedIn(true)
    localStorage.setItem('token', authToken)
  }

  const logout = async () => {
    await signOut({ redirect: false })
    setUser(null)
    setToken(null)
    setIsLoggedIn(false)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)