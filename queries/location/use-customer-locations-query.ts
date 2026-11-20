"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationApi, SaveLocationPayload, CustomerLocationRecord } from "@/services/location.service";
import { QUERY_KEYS } from "../query-keys";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

export function useCustomerSavedLocationsQuery(accessToken?: string | null) {
  const token = accessToken || (typeof window !== "undefined" ? getStoredAccessToken() : null);
  const isAuthenticated = !!token && token !== "token_vinit_default";

  return useQuery<CustomerLocationRecord[]>({
    queryKey: QUERY_KEYS.LOCATION.CUSTOMER_LOCATIONS(1, 20),
    queryFn: () => locationApi.getSavedLocations(token),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

export function useConfirmLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveLocationPayload) => locationApi.confirmLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LOCATION.ALL });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["store-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}
