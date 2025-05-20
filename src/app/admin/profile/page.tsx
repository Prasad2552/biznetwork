'use client'

import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation'

export default function AdminProfile() {
     return(
         <SessionProvider>
             <AdminProfileComponent />
         </SessionProvider>
     )
 }


function AdminProfileComponent() {
    const { data: session, update } = useSession()
     const [isLoading, setIsLoading] = useState(false)
     const [step, setStep] = useState<'input' | 'verify'>('input')
      const [currentEmail, setCurrentEmail] = useState(session?.user?.email || '')
     const [newEmail, setNewEmail] = useState('')
     const router = useRouter();

    useEffect(() => {
        setCurrentEmail(session?.user?.email || '');
     }, [session?.user?.email])

    const handleLogout = async () => {
        try {
           await signOut({ callbackUrl: "/admin/login", redirect: true});
        } catch (error) {
            console.error("Error logging out", error);
            toast.error("Failed to log out.", {
                position: 'top-right',
            })
        }
    };

     async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
         e.preventDefault()
         setIsLoading(true)

         try {
         const formData = new FormData(e.currentTarget)
         const newEmail = formData.get('newEmail') as string
         setNewEmail(newEmail)

         const response = await fetch('/api/admin/send-otp', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
             email: currentEmail,
             purpose: 'change-email'
             })
         })

         if (!response.ok) {
             throw new Error('Failed to send OTP')
         }

         setStep('verify')
         toast.success('OTP sent to your current email', { position: 'top-right'})
         } catch (error) {
         toast.error('Failed to send OTP', { position: 'top-right'})
         } finally {
         setIsLoading(false)
         }
     }

    async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData(e.currentTarget)
            const response = await fetch('/api/admin/change-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                currentEmail,
                newEmail,
                otp: formData.get('otp')
                })
            })

            if (!response.ok) {
                throw new Error('Failed to change email')
            }

            await update({ email: newEmail }) // Update session
             setCurrentEmail(newEmail) // Update current email
            toast.success('Email changed successfully', { position: 'top-right'})
           await signOut({ callbackUrl: "/admin/login", redirect: true});
           
        } catch (error) {
            toast.error('Failed to change email', { position: 'top-right'})
        } finally {
           setIsLoading(false)
        }
    }

 return (
     <div className="container mx-auto p-6">
         <ToastContainer position="top-right" />
         <Card className="max-w-md mx-auto">
         <CardHeader className="space-y-1">
         <CardTitle className="text-2xl font-bold">Admin Profile</CardTitle>
         <CardDescription>
         <div className='flex justify-end'>
                 <Button onClick={handleLogout} size="sm">
                      <Icons.logOut className="mr-2 h-4 w-4" /> Logout
                 </Button>
          </div>
         Update your admin email address
         </CardDescription>
         </CardHeader>
          
         <CardContent>
         {step === 'input' ? (
             <form onSubmit={handleEmailSubmit} className="space-y-4">
             <div className="space-y-2">
             <Label htmlFor="currentEmail">Current Email</Label>
                 <Input
                     id="currentEmail"
                     defaultValue={currentEmail || ''}
                     disabled
                 />
             </div>
             <div className="space-y-2">
                 <Label htmlFor="newEmail">New Email</Label>
                 <Input
                     id="newEmail"
                     name="newEmail"
                     type="email"
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
              Update Email
             </Button>
             </form>
        ) : (
            <form onSubmit={handleVerify} className="space-y-4">
             <div className="space-y-2">
                 <Label htmlFor="otp">Verification OTP</Label>
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
                  Verify and Change Email
                </Button>
             </form>
            )}
         </CardContent>
         </Card>
        </div>
     )
 }