// src/lib/useAuthInit.ts
import { useEffect } from "react";
import { useAuth } from "./authStore";

export const useAuthInit = () => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Check auth on app load
    checkAuth();
  }, [checkAuth]);
};