"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth/auth-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { UpdateProfileDto } from "@/types/user";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

export function useDeviceSessionsQuery() {
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.SESSIONS(),
    queryFn: () => authService.listSessions(),
    enabled: !!token,
    staleTime: 1000 * 30,
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.SESSIONS() });
    },
  });
}

export function useLogoutAllSessionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logoutAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.SESSIONS() });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileDto) => authService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE() });
    },
  });
}
