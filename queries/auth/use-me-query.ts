"use client";

import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { QUERY_KEYS } from "@/queries/query-keys";
import { useSetAtom } from "jotai";
import { userProfileAtom, authSessionAtom } from "@/stores";

export function useMeQuery() {
  const setUser = useSetAtom(userProfileAtom);
  const setSession = useSetAtom(authSessionAtom);

  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;

  return useQuery({
    queryKey: QUERY_KEYS.USER.PROFILE(),
    queryFn: async () => {
      const user = await authService.getMe();
      if (user) {
        setUser(user);
        setSession((prev) => ({
          ...prev,
          user,
          token: token || prev.token,
          isAuthenticated: true,
        }));
      }
      return user;
    },
    enabled: !!token && token !== "token_vinit_default",
    staleTime: 1000 * 60 * 5,
  });
}

