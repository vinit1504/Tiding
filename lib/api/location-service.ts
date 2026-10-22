import { SITE_CONFIG } from "@/lib/constants/site-config";
import { DeliveryLocation } from "@/types/location";

export interface PincodeItem {
  id: string;
  code: string;
  city_id?: string;
  city_name?: string;
  is_active?: boolean;
}

export interface AreaItem {
  id: string;
  name: string;
  slug?: string;
  city_id?: string;
  pincode_id?: string;
  latitude?: number | string;
  longitude?: number | string;
  is_active?: boolean;
}

export interface StoreResolutionResult {
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  isServiceable: boolean;
  deliveryEtaMinutes: number;
  raw?: any;
}

class LocationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = SITE_CONFIG.apiUrl;
  }

  /**
   * Search pincodes by query or list active pincodes
   * GET /api/v1/location/pincodes?search=...&page=1&limit=20
   */
  async searchPincodes(query: string): Promise<PincodeItem[]> {
    try {
      const q = encodeURIComponent(query.trim());
      const res = await fetch(`${this.baseUrl}/location/pincodes?search=${q}&page=1&limit=20&is_active=true`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => null);
      if (json?.success && Array.isArray(json?.data?.pincodes)) {
        return json.data.pincodes;
      }
      if (json?.success && Array.isArray(json?.data)) {
        return json.data;
      }
      return [];
    } catch (err) {
      console.warn("Pincode search API error:", err);
      return [];
    }
  }

  /**
   * Search areas by pincode or name
   * GET /api/v1/location/areas?pincode_id=...&search=...
   */
  async getAreasByPincode(pincodeId?: string, search?: string): Promise<AreaItem[]> {
    try {
      const params = new URLSearchParams();
      if (pincodeId) params.append("pincode_id", pincodeId);
      if (search) params.append("search", search.trim());
      params.append("page", "1");
      params.append("limit", "20");
      params.append("is_active", "true");

      const res = await fetch(`${this.baseUrl}/location/areas?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => null);
      if (json?.success && Array.isArray(json?.data?.areas)) {
        return json.data.areas;
      }
      if (json?.success && Array.isArray(json?.data)) {
        return json.data;
      }
      return [];
    } catch (err) {
      console.warn("Area search API error:", err);
      return [];
    }
  }

  /**
   * Resolve Store by Area ID
   * POST /api/v1/stores/resolve-delivery
   * Body: { area_id: string }
   */
  async resolveStoreByArea(areaId: string): Promise<StoreResolutionResult | null> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tiding_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${this.baseUrl}/stores/resolve-delivery`, {
        method: "POST",
        headers,
        body: JSON.stringify({ area_id: areaId }),
      });

      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      if (!json) return null;

      const data = json.data || json;
      const storeObj = data.store || (data.id || data.store_id || data.name ? data : null);
      const isServiceable = data.is_serviceable ?? data.isServiceable ?? data.serviceable ?? (!!storeObj && storeObj.status === "ACTIVE");
      const deliveryEtaMinutes = Number(
        data.delivery?.delivery_time_minutes ||
        data.deliveryEtaMinutes ||
        data.delivery_eta_minutes ||
        (isServiceable ? 10 : 0)
      );

      return {
        storeId: storeObj?.id || storeObj?.store_id || storeObj?._id,
        storeName: storeObj?.name || storeObj?.store_name || "Tiding Express Store",
        storeAddress: storeObj?.address || storeObj?.formatted_address || "",
        isServiceable: Boolean(isServiceable),
        deliveryEtaMinutes: deliveryEtaMinutes > 0 ? deliveryEtaMinutes : 10,
        raw: data,
      };
    } catch (err) {
      console.warn("Resolve store by area error:", err);
      return null;
    }
  }
}

export const locationService = new LocationService();
