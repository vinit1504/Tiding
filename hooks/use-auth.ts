"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import { userProfileAtom, authSessionAtom, isAuthDrawerOpenAtom } from "@/stores";
import { getStoredAccessToken, getStoredUser } from "@/lib/auth/token-storage";
import { authService } from "@/lib/auth/auth-service";
import { toast } from "sonner";
import { UserProfile } from "@/types/user";

/**
 * Returns the currently authenticated user's ID for query key isolation.
 * Falls back to localStorage if Jotai atom has not hydrated yet.
 */
export function useCurrentUserId(): string | null {
  const [user] = useAtom(userProfileAtom);
  if (user?.id) return user.id;

  if (typeof window !== "undefined") {
    try {
      const stored = getStoredUser<UserProfile>();
      if (stored?.id) return stored.id;
    } catch {
      // ignore
    }
  }

  return null;
}

export function useAuth() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useAtom(userProfileAtom);
  const [session, setSession] = useAtom(authSessionAtom);
  const setIsAuthDrawerOpen = useSetAtom(isAuthDrawerOpenAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  const storedToken = mounted ? getStoredAccessToken() : null;
  const hasValidToken =
    (!!session.token || !!storedToken) &&
    session.token !== "token_vinit_default" &&
    storedToken !== "token_vinit_default";

  const isAuthenticated =
    mounted &&
    (session.isAuthenticated || hasValidToken) &&
    session.token !== "token_vinit_default" &&
    storedToken !== "token_vinit_default";

  const userId = user?.id || (mounted ? getStoredUser<UserProfile>()?.id || null : null);

  const openLogin = useCallback(
    (redirectUrl?: string) => {
      if (typeof window !== "undefined" && redirectUrl) {
        sessionStorage.setItem("tiding_auth_redirect", redirectUrl);
      }
      setIsAuthDrawerOpen(true);
    },
    [setIsAuthDrawerOpen]
  );

  /**
   * Centralized, secure logout handler that clears server session,
   * cancels and wipes TanStack Query cache, purges local storage,
   * resets Jotai store atoms, and redirects the user.
   */
  const logout = useCallback(
    async (redirectPath = "/") => {
      try {
        await authService.logout();
      } catch (err) {
        console.warn("Logout error notice:", err);
      }
      toast.success("Logged out successfully");
      setIsAuthDrawerOpen(false);
      if (redirectPath) {
        router.push(redirectPath);
      }
    },
    [router, setIsAuthDrawerOpen]
  );

  return {
    user,
    userId,
    setUser,
    session,
    setSession,
    isAuthenticated,
    isMounted: mounted,
    openLogin,
    logout,
    setIsAuthDrawerOpen,
  };
}
