"use client";

import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { QUERY_KEYS } from "@/queries/query-keys";
import { useSetAtom } from "jotai";
import { userProfileAtom } from "@/stores";

export function useMeQuery() {
  const setUser = useSetAtom(userProfileAtom);

  return useQuery({
    queryKey: QUERY_KEYS.USER.PROFILE(),
    queryFn: async () => {
      const user = await authService.getMe();
      if (user) {
        setUser(user);
      }
      return user;
    },
    staleTime: 1000 * 60 * 5,
  });
}
