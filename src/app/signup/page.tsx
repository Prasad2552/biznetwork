'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const validatePassword = (password: string): boolean => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
  return regex.test(password);
};

export default function SignUp() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberPassword, setRememberPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberPassword(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!validatePassword(formData.password)) {
      toast.error("Password must be at least 6 characters long and include uppercase letters, lowercase letters, numbers, and symbols.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rememberPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
      }

      toast.success("Your account has been created successfully.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => {
        router.push('/signin');
      }, 2000); 

      if (rememberPassword) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

    } catch (error) {
      console.error("Signup error:", error);

      toast.error(error instanceof Error ? error.message : "An unexpected error occurred during signup. Please try again later or contact support.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const result = await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: false,
      })
      
      if (result?.error) {
        toast.error("Failed to sign up with Google", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      toast.error("Failed to sign up with Google", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      <ToastContainer />
      <div className="w-full max-w-[1200px] bg-[#f5f5f5] rounded-2xl p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left side - Illustration */}
          <div className="w-full lg:w-1/2 bg-[#f5f5f5] rounded-2xl p-8 ">
            <Image
              src="/uploads/Sign-up-rafiki.png"
              alt="Sign up illustration"
              width={800}
              height={700}
              priority
              className="w-full h-auto"
            />
          </div>

          {/* Right side - Sign up form */}
          <div className="w-full lg:w-[400px] bg-white rounded-2xl p-8 justify-items-center">
            <div className="mb-8">
              <Image
                src="/uploads/Logo.svg"
                alt="BizNetwork Logo"
                width={150}
                height={40}
                priority
                className="mb-6"
              />
              <h2 className="text-[28px] font-semibold text-[#1a1a1a]">Welcome!</h2>
              <p className="text-[#666666] mt-1">Please enter your details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="appearance-none relative block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 rounded-none focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm pr-10 border-t-0 border-l-0 border-r-0"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="appearance-none relative block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 rounded-none focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm pr-10 border-t-0 border-l-0 border-r-0"
                  />
                </div>
              </div>

              <div>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 rounded-none focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm pr-10 border-t-0 border-l-0 border-r-0"
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$"
                  title="Must be at least 6 characters long and include uppercase letters, lowercase letters, numbers, and symbols."
                  className="appearance-none relative block w-full px-3 py-2 border-b border-gray-300 placeholder-gray-500 text-gray-900 rounded-none focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm pr-10 border-t-0 border-l-0 border-r-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[calc(50%-20px)] text-[#666666]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center lg-whitespace-nowrap">
                <Checkbox
                  id="remember"
                  checked={rememberPassword}
                  onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                  className="border-[#444444] data-[state=checked]:bg-[#0041C2] data-[state=checked]:border-[#0041C2]"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-[#666666]">
                  Remember password
                </label>
                <p className="text-xs text-[#666666] mt-1 ml-20">Min. 6 characters</p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#0041C2] hover:bg-[#0033A3] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>

              <Button
                type="button"
                className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-[#666666] font-medium font-bold text-lg"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <Image
                  src="/uploads/Google-logo.png"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Google
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#666666]">
              Already have an account?{" "}
              <Link href="/signin" className="text-[#0041C2] hover:text-[#0033A3] font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

