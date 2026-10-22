"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { userProfileAtom, authSessionAtom, isAuthDrawerOpenAtom } from "@/stores";

export function useAuth() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useAtom(userProfileAtom);
  const [session, setSession] = useAtom(authSessionAtom);
  const setIsAuthDrawerOpen = useSetAtom(isAuthDrawerOpenAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated =
    mounted &&
    !!user &&
    session.isAuthenticated &&
    session.token !== "token_vinit_default" &&
    user?.id !== "usr-vinit";

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
