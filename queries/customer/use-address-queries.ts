"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressService } from "@/lib/api/address-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { CreateAddressDto, UpdateAddressDto } from "@/types/address";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { useCurrentUserId } from "@/hooks/use-auth";

export function useCustomerAddressesQuery() {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  return useQuery({
    queryKey: QUERY_KEYS.USER.ADDRESSES(userId),
    queryFn: () => addressService.listAddresses(),
    enabled: isAuthed,
    staleTime: 1000 * 60,
  });
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (payload: CreateAddressDto) => addressService.createAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ALL });
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ addressId, payload }: { addressId: string; payload: UpdateAddressDto }) =>
      addressService.updateAddress(addressId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ALL });
    },
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (addressId: string) => addressService.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ALL });
    },
  });
}

export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (addressId: string) => addressService.setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ALL });
    },
  });
}
