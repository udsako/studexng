// src/lib/firebaseAuth.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔥 FirebaseAuthProvider mounted – setting up auth listener");

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          console.log("✅ User authenticated:", currentUser.uid, currentUser.email);
        } else {
          console.log("❌ No authenticated user");
        }
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error("🔥 Firebase auth error:", error);
        setLoading(false);
      }
    );

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up Firebase auth listener");
      unsubscribe();
    };
  }, []);

  // Optional: Debug render
  // useEffect(() => {
  //   console.log("Auth state updated:", { loading, user: user ? user.uid : null });
  // }, [loading, user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  }
  return context;
}