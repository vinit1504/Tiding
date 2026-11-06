export interface StoreSettings {
  id: string;
  store_id: string;
  handling_fee: string | number;
  minimum_order_amount: string | number;
  maximum_order_amount: string | number;
  delivery_radius_km: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface StoreDetail {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  settings?: StoreSettings | null;
}

