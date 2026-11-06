"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth/auth-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { UpdateProfileDto } from "@/types/user";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { useCurrentUserId } from "@/hooks/use-auth";

export function useDeviceSessionsQuery() {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  return useQuery({
    queryKey: QUERY_KEYS.AUTH.SESSIONS(userId),
    queryFn: () => authService.listSessions(),
    enabled: isAuthed,
    staleTime: 1000 * 30,
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.SESSIONS(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.ALL });
    },
  });
}

export function useLogoutAllSessionsMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: () => authService.logoutAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.SESSIONS(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.ALL });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (payload: UpdateProfileDto) => authService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ALL });
    },
  });
}
