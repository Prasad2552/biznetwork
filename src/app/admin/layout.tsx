import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Only check auth for admin routes except login
  if (pathname.startsWith('/admin') && !pathname.includes('/admin/login')) {
    if (!session?.user?.role || session.user.role !== 'admin') {
      redirect('/admin/login')
    }
  }

  // If logged in as admin and trying to access login page, redirect to dashboard
  if (session?.user?.role === 'admin' && pathname.includes('/admin/login')) {
    redirect('/admin/dashboard')
  }

  return <>{children}</>
}

