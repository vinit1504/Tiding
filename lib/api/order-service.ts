import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import { CreateOrderPayload, CreateOrderResponse } from "@/types/payment";
import { BackendOrder } from "@/types/order";

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

export class OrderService {
  /**
   * POST /api/v1/orders
   * Create an order from active cart items
   */
  async createOrder(
    payload: CreateOrderPayload,
    fallbackData?: CreateOrderResponse
  ): Promise<CreateOrderResponse> {
    const res = await apiClient.post<
      { data: CreateOrderResponse; success: boolean } | CreateOrderResponse,
      CreateOrderPayload
    >(
      API_ENDPOINTS.ORDERS.CREATE,
      payload,
      fallbackData ? { fallbackData } : undefined
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CreateOrderResponse;
  }

  /**
   * GET /api/v1/orders
   * Fetch active orders with pagination and sorting
   */
  async getMyOrders(params?: GetOrdersParams): Promise<BackendOrder[]> {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(params?.page || 1));
    searchParams.set("limit", String(params?.limit || 20));
    searchParams.set("sortBy", params?.sortBy || "created_at");
    searchParams.set("sortOrder", params?.sortOrder || "desc");
    if (params?.status) {
      searchParams.set("status", params.status);
    }

    const endpoint = `${API_ENDPOINTS.ORDERS.LIST}?${searchParams.toString()}`;
    const res = await apiClient.get<any>(endpoint, []);

    // Support both wrapped array { data: [...] } and raw array [...]
    if (Array.isArray(res)) {
      return res as BackendOrder[];
    }
    if (res && Array.isArray(res.data)) {
      return res.data as BackendOrder[];
    }
    return [];
  }

  /**
   * GET /api/v1/orders/:orderId
   * Fetch specific order details
   */
  async getOrder(orderId: string): Promise<BackendOrder | null> {
    const res = await apiClient.get<any>(API_ENDPOINTS.ORDERS.DETAIL(orderId));
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as BackendOrder;
  }

  /**
   * POST /api/v1/orders/:orderId/cancel
   * Cancel an order in PENDING or CONFIRMED state
   */
  async cancelOrder(orderId: string, reason: string = "Customer requested cancellation."): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }, { reason: string }>(
      API_ENDPOINTS.ORDERS.CANCEL(orderId),
      { reason }
    );
  }
}

export const orderService = new OrderService();

