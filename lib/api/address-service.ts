import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import { CustomerAddress, CreateAddressDto, UpdateAddressDto } from "@/types/address";

export class AddressService {
  /**
   * 1. GET /api/v1/customers/addresses
   * List all saved delivery addresses for current customer
   */
  async listAddresses(): Promise<CustomerAddress[]> {
    const res = await apiClient.get<CustomerAddress[] | { data: CustomerAddress[] }>(
      API_ENDPOINTS.CUSTOMERS.ADDRESSES,
      []
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  }

  /**
   * 2. POST /api/v1/customers/addresses
   * Create a new delivery address
   */
  async createAddress(payload: CreateAddressDto): Promise<CustomerAddress> {
    const res = await apiClient.post<CustomerAddress | { data: CustomerAddress }, CreateAddressDto>(
      API_ENDPOINTS.CUSTOMERS.ADDRESSES,
      payload
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CustomerAddress;
  }

  /**
   * 3. PUT /api/v1/customers/addresses/:id
   * Update an existing address
   */
  async updateAddress(addressId: string, payload: UpdateAddressDto): Promise<CustomerAddress> {
    const res = await apiClient.patch<CustomerAddress | { data: CustomerAddress }, UpdateAddressDto>(
      API_ENDPOINTS.CUSTOMERS.ADDRESS(addressId),
      payload
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CustomerAddress;
  }

  /**
   * 4. DELETE /api/v1/customers/addresses/:id
   * Soft-delete an address
   */
  async deleteAddress(addressId: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.CUSTOMERS.ADDRESS(addressId)
    );
  }

  /**
   * 5. PATCH /api/v1/customers/addresses/:id/default
   * Set address as primary default
   */
  async setDefaultAddress(addressId: string): Promise<CustomerAddress> {
    const res = await apiClient.patch<CustomerAddress | { data: CustomerAddress }, { target: string }>(
      API_ENDPOINTS.CUSTOMERS.SET_DEFAULT_ADDRESS(addressId),
      { target: "BOTH" }
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CustomerAddress;
  }
}

export const addressService = new AddressService();
