"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff } from "lucide-react"
import { MdOutlineEmail } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberPassword, setRememberPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.info("Signing in...", {
      position: "top-right",
      autoClose: 1000,
    })
    setIsLoading(true)

    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || "Invalid email or password", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        return
      }

      if (data.message === "Sign in successful") {
        localStorage.setItem("token", data.token || "")
        toast.success("You have successfully signed in!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        router.refresh()
        router.push("/")
      }
    } catch (error) {
      toast.error("An error occurred while signing in. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", {
        callbackUrl: "/",
      })
      router.refresh()
    } catch (error) {
      console.error("Sign-in error:", error)
      toast.error("Failed to sign in with Google", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-2 md:p-10 lg:p-10">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="w-full max-w-[1200px] bg-[#f5f5f5] rounded-2xl p-2 md:p-10 lg:p-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left side - Illustration */}
          <div className="w-full lg:w-1/2 bg-[#f5f5f5] rounded-2xl p-8">
            <Image
              src="/uploads/Computer-login-rafiki .png"
              alt="Sign in illustration"
              width={600}
              height={500}
              priority
              className="w-full h-auto"
            />
          </div>

          {/* Right side - Sign in form */}
          <div className="w-full lg:w-[400px] bg-white rounded-2xl p-8 justify-items-center">
            <div className="mb-8">
              <Image src="/uploads/Logo.svg" alt="BizNetwork Logo" width={150} height={40} priority className="mb-6" />
              <h2 className="text-[28px] font-semibold text-[#1a1a1a]">Welcome back!</h2>
              <p className="text-[#666666] mt-1">Please enter your details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 rounded-none focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm pr-10 border-t-0 border-l-0 border-r-0"
                />
                <MdOutlineEmail className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] h-5 w-5" />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 rounded-none focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm pr-10 border-t-0 border-l-0 border-r-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between whitespace-nowrap gap-4">
                <div className="flex items-center mt-4">
                  <Checkbox
                    id="remember"
                    checked={rememberPassword}
                    onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                    className="border-[#e5e5e5] data-[state=checked]:bg-[#0041C2] data-[state=checked]:border-[#0041C2] mr-2"
                  />
                  <label htmlFor="remember" className="mr-10 text-sm text-[#666666]">
                    Remember password
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm text-[#0041C2] hover:text-[#0033A3] mt-4">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#0041C2] hover:bg-[#0033A3] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Login"}
              </Button>

              <Button
                type="button"
                className="w-full bg-gray-100 h-11 hover:bg-gray-100 text-[#666666] font-medium font-semibold text-base"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Image src="/uploads/Google-logo.png" alt="Google" width={20} height={20} className="mr-2" />
                Google
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#666666]">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#0041C2] hover:text-[#0033A3] font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

