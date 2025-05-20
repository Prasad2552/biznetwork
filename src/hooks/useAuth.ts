// src/hooks/useAuth.ts
"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  session: any; 
  role: string | null;
  isAdmin: boolean;
}

interface AuthHookReturn extends AuthState {
    logout: () => Promise<void>
}

export function useAuth(): AuthHookReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(status === 'loading');
  const [role, setRole] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    

  useEffect(() => {
    setIsLoading(status === 'loading');
    const authenticated = status === 'authenticated';
    setIsLoggedIn(authenticated);
      
    if(session?.user?.role) {
      setRole(session.user.role);
      setIsAdmin(session.user.role === 'admin');
     } else {
         setRole(null);
         setIsAdmin(false);
      }

  }, [status, session]);


  const logout = async () => {
    try {
      await signOut();
      setIsLoggedIn(false);
      setRole(null);
      setIsAdmin(false);
      router.push('/');
    } catch (error) {
      console.log(error);
    }
  };

  return {
    isLoggedIn,
    logout,
    isLoading,
    session,
    role,
      isAdmin
  };
}