"use client";

import { useAuthContext } from "@/contexts/auth-context";

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthContext();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
