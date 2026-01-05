// src/components/ProtectedRoute.tsx
"use client";

import { useFirebaseAuth } from "@/lib/firebaseAuth";
import { useAuth } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();
  const { isLoggedIn, isHydrated } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for both Firebase and Zustand to be ready
    if (!firebaseLoading && isHydrated) {
      setIsReady(true);

      // Only redirect if both systems confirm user is NOT logged in
      if (!firebaseUser && !isLoggedIn) {
        router.push("/auth");
      }
    }
  }, [firebaseLoading, isHydrated, firebaseUser, isLoggedIn, router]);

  // Show loading while auth is being checked
  if (!isReady || firebaseLoading || !isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 border-4 border-transparent bg-gradient-to-r from-teal-500 to-purple-600 rounded-full animate-spin" style={{
            WebkitMaskImage: 'linear-gradient(transparent 40%, black 60%)',
            maskImage: 'linear-gradient(transparent 40%, black 60%)'
          }}></div>
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is logged in (in either system), allow access
  if (firebaseUser || isLoggedIn) {
    return <>{children}</>;
  }

  // Otherwise, redirect is happening, show nothing
  return null;
}