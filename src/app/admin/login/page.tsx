'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';


export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const router = useRouter()

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setIsLoading(true);

      try {
       await handleCredentials(e);
       
       }catch(e) {
            console.error(e);
        }
      finally {
           setIsLoading(false);
         }
    };

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      setEmail(email)

      // Send OTP
      const response = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'login' })
      })

      if (!response.ok) {
        throw new Error('Failed to send OTP')
      }

      setStep('otp')
      toast.success('OTP sent to your email')
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOTP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await signIn('credentials', {
        email,
        password: formData.get('password') as string,
        otp: formData.get('otp') as string,
        redirect: true,
        callbackUrl: '/admin/channels',
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        router.push('/admin/channels')
        router.refresh()
      }
    } catch (error:any) {
     
        toast.error(error?.message || 'An error occurred during login');
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <ToastContainer />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            {step === 'credentials' 
              ? 'Enter your admin email to receive an OTP'
              : 'Enter your password and OTP to login'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'credentials' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="Enter OTP from email"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Login
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <a 
            href="/admin/forgot-password"
            className="text-sm text-blue-600 hover:underline"
            >
            Forgot password?
          </a>
        </CardFooter>
      </Card>
    </div>
  )
}