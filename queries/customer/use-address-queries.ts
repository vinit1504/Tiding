"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressService } from "@/lib/api/address-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { CreateAddressDto, UpdateAddressDto } from "@/types/address";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

export function useCustomerAddressesQuery() {
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  return useQuery({
    queryKey: QUERY_KEYS.USER.ADDRESSES(),
    queryFn: () => addressService.listAddresses(),
    enabled: !!token && token !== "token_vinit_default",
    staleTime: 1000 * 60,
  });
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAddressDto) => addressService.createAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE() });
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, payload }: { addressId: string; payload: UpdateAddressDto }) =>
      addressService.updateAddress(addressId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE() });
    },
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => addressService.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE() });
    },
  });
}

export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) => addressService.setDefaultAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE() });
    },
  });
}
