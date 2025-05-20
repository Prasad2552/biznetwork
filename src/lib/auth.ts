import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verify } from 'jsonwebtoken'

export async function verifyAuth(token: string): Promise<string | null> {
  try {
    const decoded = verify(token, process.env.JWT_SECRET as string) as { userId: string }
    return decoded.userId
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUserId = localStorage.getItem('userId')
    if (storedToken && storedUserId) {
      setIsLoggedIn(true)
      setToken(storedToken)
      setUserId(storedUserId)
    }
  }, [])

  const login = (newToken: string, newUserId: string) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('userId', newUserId)
    setIsLoggedIn(true)
    setToken(newToken)
    setUserId(newUserId)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    setIsLoggedIn(false)
    setToken(null)
    setUserId(null)
    router.push('/')
  }

  return { isLoggedIn, token, userId, login, logout }
}


