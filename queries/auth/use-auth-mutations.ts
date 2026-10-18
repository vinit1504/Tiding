"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { QUERY_KEYS } from "@/queries/query-keys";
import { useSetAtom } from "jotai";
import { userProfileAtom, authSessionAtom } from "@/stores";

export function useSendEmailOtpMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.sendEmailOtp(email),
  });
}

export function useVerifyEmailOtpMutation() {
  const queryClient = useQueryClient();
  const setUser = useSetAtom(userProfileAtom);
  const setSession = useSetAtom(authSessionAtom);

  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authService.verifyEmailOtp(email, otp),
    onSuccess: (data) => {
      setUser(data.user);
      setSession({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE() });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const setUser = useSetAtom(userProfileAtom);
  const setSession = useSetAtom(authSessionAtom);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      setUser(null);
      setSession({
        user: null,
        token: null,
        isAuthenticated: false,
      });
      queryClient.clear();
    },
  });
}
