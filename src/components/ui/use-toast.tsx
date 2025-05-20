'use client'

import { useState, useEffect, useCallback } from 'react'

type ToastProps = {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

type ToastState = ToastProps & {
  id: number
  visible: boolean
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const toast = useCallback(({ title, description, variant = 'default' }: ToastProps) => {
    const id = Date.now()
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, title, description, variant, visible: true },
    ])

    setTimeout(() => {
      setToasts((prevToasts) =>
        prevToasts.map((t) => (t.id === id ? { ...t, visible: false } : t))
      )
    }, 3000)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.visible))
    }, 3500)

    return () => clearInterval(timer)
  }, [])

  return { toast, toasts }
}

export function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md p-4 shadow-md transition-opacity duration-300 ${
            toast.visible ? 'opacity-100' : 'opacity-0'
          } ${
            toast.variant === 'destructive'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-900'
          }`}
        >
          <h3 className="font-semibold">{toast.title}</h3>
          {toast.description && <p className="mt-1 text-sm">{toast.description}</p>}
        </div>
      ))}
    </div>
  )
}