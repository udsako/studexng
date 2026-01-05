// src/lib/authStore.ts
// CRITICAL FIX: Added Firebase onAuthStateChanged integration and checkAuth method
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { api } from "./api";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone: string;
  user_type: string;
  matric_number?: string | null;
  hostel?: string;
  business_name?: string | null;
  is_verified_vendor: boolean;
  wallet_balance: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  isAuthReady: boolean; // NEW: Track if auth check is complete

  login: (userData: UserProfile, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (userData: UserProfile) => void;
  setHydrated: (hydrated: boolean) => void;
  checkAuth: () => Promise<void>; // NEW: Check and restore auth state
  setAuthReady: (ready: boolean) => void; // NEW: Mark auth as ready
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      isAuthReady: false,

      login: (userData, accessToken, refreshToken) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);

        set({
          user: userData,
          isLoggedIn: true,
          accessToken,
          refreshToken,
          isAuthReady: true,
        });
      },

      logout: async () => {
        try {
          // Sign out from Firebase
          await firebaseSignOut(auth);

          // Call backend logout
          await api.logout();
        } catch (error) {
          console.error("Logout error:", error);
        }

        // Clear localStorage
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        set({
          user: null,
          isLoggedIn: false,
          accessToken: null,
          refreshToken: null,
          isAuthReady: true,
        });
      },

      setUser: (userData) => {
        set({ user: userData });
      },

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },

      setAuthReady: (ready: boolean) => {
        set({ isAuthReady: ready });
      },

      // CRITICAL FIX: Check auth state from localStorage and Firebase
      checkAuth: async () => {
        try {
          const accessToken = localStorage.getItem("access_token");
          const refreshToken = localStorage.getItem("refresh_token");

          if (!accessToken || !refreshToken) {
            // No tokens found - user is not logged in
            set({ isLoggedIn: false, user: null, isAuthReady: true });
            return;
          }

          // Verify tokens are still valid by fetching user profile
          try {
            const userProfile = await api.getProfile();

            // Tokens are valid - restore auth state
            set({
              user: userProfile,
              isLoggedIn: true,
              accessToken,
              refreshToken,
              isAuthReady: true,
            });
          } catch (error) {
            // Tokens invalid or expired - clear auth state
            console.error("Auth check failed:", error);
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            set({
              user: null,
              isLoggedIn: false,
              accessToken: null,
              refreshToken: null,
              isAuthReady: true,
            });
          }
        } catch (error) {
          console.error("Check auth error:", error);
          set({ isAuthReady: true });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);

// CRITICAL FIX: Set up Firebase onAuthStateChanged listener
if (typeof window !== "undefined") {
  onAuthStateChanged(auth, async (firebaseUser) => {
    console.log("Firebase auth state changed:", firebaseUser ? "logged in" : "logged out");

    // If Firebase user exists but Zustand says not logged in, sync state
    const { isLoggedIn, checkAuth } = useAuth.getState();

    if (firebaseUser && !isLoggedIn) {
      console.log("Firebase user detected, checking auth state...");
      await checkAuth();
    } else if (!firebaseUser && isLoggedIn) {
      console.log("Firebase user logged out, clearing auth state...");
      useAuth.getState().logout();
    }
  });
}