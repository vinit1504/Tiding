// Re-export from modular lib/api architecture and location.service
export * from "@/lib/api/location-service";
export { locationApi } from "./location.service";
export type {
  ReverseGeocodeResponse,
  IpLookupResponse,
  CustomerLocationRecord,
} from "./location.service";
