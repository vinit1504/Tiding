"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { userProfileAtom, authSessionAtom, isAuthDrawerOpenAtom } from "@/stores";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

export function useAuth() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useAtom(userProfileAtom);
  const [session, setSession] = useAtom(authSessionAtom);
  const setIsAuthDrawerOpen = useSetAtom(isAuthDrawerOpenAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  const storedToken = mounted ? getStoredAccessToken() : null;
  const hasValidToken = (!!session.token || !!storedToken) && session.token !== "token_vinit_default" && storedToken !== "token_vinit_default";

  const isAuthenticated =
    mounted &&
    (session.isAuthenticated || hasValidToken) &&
    session.token !== "token_vinit_default" &&
    storedToken !== "token_vinit_default";

  const openLogin = useCallback(
    (redirectUrl?: string) => {
      if (typeof window !== "undefined" && redirectUrl) {
        sessionStorage.setItem("tiding_auth_redirect", redirectUrl);
      }
      setIsAuthDrawerOpen(true);
    },
    [setIsAuthDrawerOpen]
  );

  return {
    user,
    setUser,
    session,
    setSession,
    isAuthenticated,
    isMounted: mounted,
    openLogin,
    setIsAuthDrawerOpen,
  };
}
