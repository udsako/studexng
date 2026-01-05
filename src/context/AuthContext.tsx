// src/context/AuthContext.tsx
// CRITICAL FIX: Complete AuthContext with Firebase integration and auth state management
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/authStore";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  isLoggedIn: boolean;
  user: any | null;
  isLoading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  isLoading: true,
  isAuthReady: false,
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoggedIn, checkAuth, isAuthReady, isHydrated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      // Wait for Zustand to hydrate from localStorage
      if (!isHydrated) {
        return;
      }

      // Check auth state from tokens
      await checkAuth();
      setIsLoading(false);
    };

    initAuth();
  }, [checkAuth, isHydrated]);

  // Redirect logic for protected routes
  useEffect(() => {
    if (!isAuthReady || isLoading) return;

    const publicRoutes = ["/", "/auth", "/terms", "/privacy", "/contact"];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isLoggedIn && !isPublicRoute) {
      // User not logged in but trying to access protected route
      console.log("Redirecting to /auth - user not logged in");
      router.push("/auth");
    }
  }, [isLoggedIn, isAuthReady, isLoading, pathname, router]);

  const value = {
    isLoggedIn,
    user,
    isLoading,
    isAuthReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
