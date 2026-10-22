export type AddressType = "HOME" | "WORK" | "OTHER";

export interface CustomerAddress {
  id: string;
  user_id?: string;
  address_type: AddressType;
  recipient_name: string;
  recipient_phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  landmark?: string | null;
  area_id: string;
  city_id: string;
  state_id: string;
  country_id: string;
  pincode_id?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  is_default?: boolean;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
  delivery_instructions?: string | null;
  area_name?: string;
  city_name?: string;
  state_name?: string;
  pincode?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAddressDto {
  address_type?: AddressType;
  recipient_name: string;
  recipient_phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  landmark?: string | null;
  area_id: string;
  city_id: string;
  state_id: string;
  country_id: string;
  pincode_id?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  is_default?: boolean;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
  delivery_instructions?: string | null;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {}
