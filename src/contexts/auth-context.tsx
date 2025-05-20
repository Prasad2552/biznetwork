 //  src/contexts/auth-context.tsx
 "use client";
 import React, { createContext, useState, useContext } from 'react';
 
 interface AuthContextType {
   isSignInModalOpen: boolean;
   openSignInModal: () => void;
   closeSignInModal: () => void;
 }
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 interface AuthProviderProps {
   children: React.ReactNode;
 }
 export function AuthProvider({ children }: AuthProviderProps) {
   const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
 
   const openSignInModal = () => {
     setIsSignInModalOpen(true);
   };
 
   const closeSignInModal = () => {
     setIsSignInModalOpen(false);
   };
   const authContextValue = {
     isSignInModalOpen,
     openSignInModal,
     closeSignInModal,
   }
    return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
 }
 export const useAuthContext = () => {
   const context = useContext(AuthContext);
   if (!context) {
     throw new Error('useAuthContext must be used within a AuthProvider');
   }
   return context;
 };
 