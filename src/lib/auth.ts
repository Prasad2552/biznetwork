'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setIsLoggedIn(true)
      setUserId(session.user.id)
      const storedToken = localStorage.getItem('token')
      setToken(storedToken)
    } else {
      setIsLoggedIn(false)
      setUserId(null)
      setToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
    }
  }, [session, status])

  const login = (newToken: string, newUserId: string) => {
    setIsLoggedIn(true)
    setToken(newToken)
    setUserId(newUserId)
    localStorage.setItem('token', newToken)
    localStorage.setItem('userId', newUserId)
  }

  const logout = async () => {
    try {
      await signOut({ redirect: false })
      setIsLoggedIn(false)
      setToken(null)
      setUserId(null)
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return { isLoggedIn, token, userId, login, logout }
}