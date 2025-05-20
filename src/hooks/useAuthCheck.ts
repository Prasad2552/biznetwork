// src/hooks/useAuthCheck.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface AuthCheckReturn {
    isUserLoggedIn: boolean;
    isAdmin: boolean;
    handleLogout: () => Promise<void>;
    token: string | null;
}

export const useAuthCheck = (): AuthCheckReturn => {
    const { data: session, status } = useSession();  // Use status to track loading
    const [token, setToken] = useState<string | null>(null);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false); // State for admin check
    const router = useRouter();

    const handleLogout = useCallback(async () => {
        try {
            localStorage.removeItem('token');
            await signOut({ redirect: false });
            toast.success('Logged out successfully!', { position: 'top-right' });
            router.push('/');
        } catch (error) {
            console.error("Error during logout:", error);
            toast.error('Logout failed. Please try again.', { position: 'top-right' });
        }
    }, [router]);

    useEffect(() => {
        // Set isUserLoggedIn and isAdmin based on session and loading status
        if (status === 'loading') {
            setIsUserLoggedIn(false);
            setIsAdmin(false);
            return;
        }

        setIsUserLoggedIn(!!session?.user); // session?.user exists isLoggedIn
        setIsAdmin(session?.user?.role === 'admin');

        // Set token from localStorage, only if a valid session exists.
        if (session?.user) {
            const storedToken = localStorage.getItem('token');
            setToken(storedToken);
        } else {
            setToken(null); // Or a default value
        }
    }, [session, status]);

    return { isUserLoggedIn, isAdmin, handleLogout, token };
};