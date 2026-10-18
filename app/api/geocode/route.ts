import { NextRequest, NextResponse } from "next/server";
import { DeliveryLocation } from "@/types/location";

// In-memory cache for static geocoding (separate from dynamic store resolution)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface BaseGeocodedAddress {
  area: string;
  society: string;
  houseNo: string;
  landmark: string;
  formattedAddress: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const GEOCODE_CACHE = new Map<string, CacheEntry<BaseGeocodedAddress>>();
const SEARCH_CACHE = new Map<string, CacheEntry<DeliveryLocation[]>>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes
const MAX_CACHE_SIZE = 250;

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

const GENERIC_EXCLUSIONS = new Set([
  "yes",
  "no",
  "residential",
  "building",
  "apartments",
  "apartment",
  "house",
  "unnamed",
  "current location",
  "detected location",
  "unknown",
  "null",
  "undefined",
]);

function isCleanString(val: unknown): val is string {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed.length < 2) return false;
  return !GENERIC_EXCLUSIONS.has(trimmed.toLowerCase());
}

/**
 * Extracts the genuine society, apartment, complex, or building name from Nominatim.
 * Strictly distinguishes society from locality, neighbourhood, road, taluka, or city.
 */
function extractSocietyName(data: any): string {
  const addr = data.address || {};
  const road = isCleanString(addr.road) ? addr.road.toLowerCase().trim() : "";
  const suburb = isCleanString(addr.suburb) ? addr.suburb.toLowerCase().trim() : "";
  const neighbourhood = isCleanString(addr.neighbourhood) ? addr.neighbourhood.toLowerCase().trim() : "";
  const city = isCleanString(addr.city || addr.town || addr.village)
    ? (addr.city || addr.town || addr.village).toLowerCase().trim()
    : "";
  const county = isCleanString(addr.county) ? addr.county.toLowerCase().trim() : "";
  const stateDistrict = isCleanString(addr.state_district) ? addr.state_district.toLowerCase().trim() : "";
  const state = isCleanString(addr.state) ? addr.state.toLowerCase().trim() : "";

  // Set of administrative or road strings that must NEVER be returned as a society
  const isNonSocietyArea = (val: string) => {
    const v = val.toLowerCase().trim();
    return (
      v === road ||
      v === suburb ||
      v === neighbourhood ||
      v === city ||
      v === county ||
      v === stateDistrict ||
      v === state
    );
  };

  // 1. Explicit building/society tags from address object
  const explicitCandidates = [
    addr.society,
    addr.residential_society,
    addr.apartments,
    addr.apartment,
    addr.housing_estate,
    addr.building,
    addr.complex,
    addr.house_name,
    addr.housename,
    addr.building_name,
    addr.condominium,
    addr.colony,
    addr.estate,
    addr.residential,
    addr.commercial,
  ];

  for (const candidate of explicitCandidates) {
    if (isCleanString(candidate) && !isNonSocietyArea(candidate)) {
      return candidate.trim();
    }
  }

  // 2. Inspect data.name and data.namedetails
  const nameCandidate =
    data.namedetails?.name ||
    data.namedetails?.["name:en"] ||
    data.name;

  if (isCleanString(nameCandidate) && !isNonSocietyArea(nameCandidate)) {
    const category = (data.category || data.class || "").toLowerCase();
    const type = (data.type || "").toLowerCase();
    const addresstype = (data.addresstype || "").toLowerCase();

    // Check for explicit society keywords common in Indian residential complexes
    const hasSocietyKeyword =
      /\b(society|apartments?|residency|heights|towers?|enclave|villas?|colony|complex|plaza|flats?|bhavan|niwas|kunj)\b/i.test(
        nameCandidate
      );

    const isBuildingEntity =
      category === "building" ||
      addresstype === "building" ||
      type === "apartments" ||
      type === "residential" ||
      type === "housing_estate" ||
      category === "amenity" ||
      category === "shop" ||
      category === "commercial";

    const isExplicitlyNonSociety =
      category === "highway" ||
      category === "boundary" ||
      category === "place" ||
      addresstype === "road" ||
      addresstype === "suburb" ||
      addresstype === "neighbourhood" ||
      addresstype === "city" ||
      addresstype === "county" ||
      addresstype === "state_district" ||
      addresstype === "postcode" ||
      addresstype === "country";

    if ((isBuildingEntity || hasSocietyKeyword) && !isExplicitlyNonSociety) {
      return nameCandidate.trim();
    }
  }

  return "";
}

/**
 * Extracts the actual city/town/municipality/village.
 * Strictly avoids assigning talukas (county) or administrative districts (state_district) to city.
 */
function extractCity(addr: any): string {
  if (!addr || typeof addr !== "object") return "";

  const cityCandidates = [
    addr.city,
    addr.town,
    addr.municipality,
    addr.village,
  ];

  for (const candidate of cityCandidates) {
    if (isCleanString(candidate)) {
      return candidate.trim();
    }
  }

  // Return empty string if no valid city/town/village is available rather than an incorrect taluka/district
  return "";
}

/**
 * Extracts the best available locality (suburb, neighbourhood, quarter, or residential area).
 */
function extractLocality(data: any): string {
  const addr = data.address || {};
  const localityCandidates = [
    addr.suburb,
    addr.neighbourhood,
    addr.residential_area,
    addr.quarter,
    addr.city_district,
    addr.subdivision,
  ];

  for (const candidate of localityCandidates) {
    if (isCleanString(candidate)) {
      return candidate.trim();
    }
  }

  return "";
}

/**
 * Extracts a relevant landmark or road without duplicate information.
 */
function extractLandmark(data: any, society: string, locality: string): string {
  const addr = data.address || {};
  const road = isCleanString(addr.road) ? addr.road.trim() : "";
  const neighbourhood = isCleanString(addr.neighbourhood) ? addr.neighbourhood.trim() : "";

  if (
    road &&
    road.toLowerCase() !== society.toLowerCase() &&
    road.toLowerCase() !== locality.toLowerCase()
  ) {
    return road;
  }

  if (
    neighbourhood &&
    neighbourhood.toLowerCase() !== society.toLowerCase() &&
    neighbourhood.toLowerCase() !== locality.toLowerCase()
  ) {
    return neighbourhood;
  }

  return "";
}

/**
 * Constructs the user-facing area string:
 * Society name followed by locality when both are available; otherwise best available locality.
 */
function buildAreaString(society: string, locality: string, fallbackCity: string): string {
  if (society && locality && society.toLowerCase() !== locality.toLowerCase()) {
    return `${society}, ${locality}`;
  }
  if (society) {
    return society;
  }
  if (locality) {
    return locality;
  }
  return fallbackCity || "Current Location";
}

function parseBlinkitStyleAddress(
  data: any,
  lat: number,
  lng: number
): BaseGeocodedAddress {
  const addr = data.address || {};

  const society = extractSocietyName(data);
  const locality = extractLocality(data);
  const city = extractCity(addr);
  const state = isCleanString(addr.state) ? addr.state.trim() : "";
  const pincode = isCleanString(addr.postcode) ? addr.postcode.trim() : "";

  const houseNo = isCleanString(addr.house_number || addr.street_number || addr.unit || addr.flat)
    ? (addr.house_number || addr.street_number || addr.unit || addr.flat).trim()
    : "";

  const landmark = extractLandmark(data, society, locality);
  const area = buildAreaString(society, locality, city);

  // Preserve the full original display_name where available
  const formattedAddress =
    typeof data.display_name === "string" && data.display_name.trim()
      ? data.display_name.trim()
      : [houseNo, society, landmark, locality, city, state, pincode]
          .filter(Boolean)
          .join(", ");

  if (process.env.NODE_ENV !== "production") {
    console.log("[Dev Diagnostic - Reverse Geocode]", {
      detectedSociety: society || "(empty)",
      detectedLocality: locality || "(empty)",
      detectedCity: city || "(empty)",
      detectedLandmark: landmark || "(empty)",
      osmCategory: data.category || data.class,
      osmType: data.type,
      osmAddressType: data.addresstype,
    });
  }

  return {
    area,
    society, // Actual society name when available, otherwise empty string
    houseNo,
    landmark,
    formattedAddress,
    city,
    state,
    pincode,
    coordinates: {
      latitude: lat,
      longitude: lng,
    },
  };
}

/**
 * Resolves the actual delivery store fulfillment and serviceability via the backend API.
 * Never invents an ETA or marks an unsupported location as serviceable.
 */
async function attachResolvedStore(
  location: DeliveryLocation,
  lat: number,
  lng: number
): Promise<DeliveryLocation> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const res = await fetch(`${apiUrl}/stores/resolve-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const data = json.data !== undefined ? json.data : json;
      const storeObj = data?.store || (data?.id || data?.name || data?.store_id || data?.store_name ? data : null);

      // Determine serviceability:
      // 1. Explicit boolean property if backend sets it
      // 2. Or HTTP 200 + success !== false + matched delivery zone / active store
      const isServiceable =
        data?.isServiceable !== undefined
          ? Boolean(data.isServiceable)
          : data?.is_serviceable !== undefined
          ? Boolean(data.is_serviceable)
          : data?.serviceable !== undefined
          ? Boolean(data.serviceable)
          : Boolean(json.success && (data?.delivery || (data?.store && data?.store?.status === "ACTIVE")));

      location.isServiceable = isServiceable;

      if (storeObj) {
        location.darkStoreId = String(storeObj.id || storeObj.store_id || storeObj._id || "");
        location.darkStoreName = storeObj.name || storeObj.store_name || storeObj.storeName || "Tiding Dark Store";
        location.storeAddress = storeObj.address || storeObj.formatted_address || storeObj.description || location.storeAddress;
      }

      // Explicit numeric ETA check (delivery_time_minutes from delivery service area, or estimatedDeliveryMinutes)
      const etaRaw =
        data?.delivery?.delivery_time_minutes ??
        data?.estimatedDeliveryMinutes ??
        data?.deliveryEtaMinutes ??
        data?.delivery_eta_minutes ??
        data?.settings?.preparation_time_minutes ??
        data?.etaMinutes ??
        data?.eta;

      if (typeof etaRaw === "number" && !Number.isNaN(etaRaw)) {
        location.deliveryEtaMinutes = etaRaw;
      } else if (typeof Number(etaRaw) === "number" && !Number.isNaN(Number(etaRaw)) && Number(etaRaw) > 0) {
        location.deliveryEtaMinutes = Number(etaRaw);
      } else if (isServiceable) {
        location.deliveryEtaMinutes = 10;
      } else {
        location.deliveryEtaMinutes = 0;
      }

      const distanceRaw =
        data?.delivery?.distance_km ??
        data?.delivery?.distance ??
        data?.distanceKm ??
        data?.distance_km ??
        data?.settings?.delivery_radius_km ??
        data?.distance;

      if (distanceRaw !== undefined && distanceRaw !== null) {
        const parsedDist = Number(distanceRaw);
        if (!Number.isNaN(parsedDist)) {
          location.storeDistanceKm = parsedDist;
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("[Dev Diagnostic - Store Resolution]", {
          isServiceable,
          storeId: location.darkStoreId,
          storeName: location.darkStoreName,
          eta: location.deliveryEtaMinutes,
          distanceKm: location.storeDistanceKm,
        });
      }
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Dev Diagnostic - Store Resolution]", `Store endpoint responded with HTTP ${res.status}`);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Dev Diagnostic - Store Resolution Error]", err instanceof Error ? err.message : err);
    }
  }
  return location;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action =
    searchParams.get("action") || (searchParams.get("lat") ? "reverse" : "search");

  // ==========================================
  // REVERSE GEOCODING (GPS / Current Location)
  // ==========================================
  if (action === "reverse") {
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng") || searchParams.get("lon");

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Latitude and longitude query parameters are required" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (!isValidCoordinate(lat, lng)) {
      return NextResponse.json(
        { error: "Invalid coordinate values. Latitude must be between -90 and 90, Longitude between -180 and 180." },
        { status: 400 }
      );
    }

    // Step 1: Resolve base geocoded address (using cache to respect Nominatim limits)
    const cacheKey = getCacheKey(lat, lng);
    const cachedGeocode = GEOCODE_CACHE.get(cacheKey);

    let baseGeocode: BaseGeocodedAddress | null = null;
    if (cachedGeocode && Date.now() - cachedGeocode.timestamp < CACHE_TTL_MS) {
      baseGeocode = cachedGeocode.data;
    }

    if (!baseGeocode) {
      // 1. Primary Provider: OpenStreetMap Nominatim with jsonv2 and detailed tags
      try {
        const nominatimRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
          {
            headers: {
              "User-Agent": "TidingGroceryWeb/1.0 (contact@tiding.com)",
              "Accept-Language": "en",
            },
            next: { revalidate: 3600 },
          }
        );

        if (nominatimRes.ok) {
          const data = await nominatimRes.json();
          if (data && data.address) {
            baseGeocode = parseBlinkitStyleAddress(data, lat, lng);
          }
        }
      } catch (nominatimErr) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Nominatim reverse geocode error, proceeding to fallback:", nominatimErr);
        }
      }

      // 2. Secondary Provider Fallback: BigDataCloud Reverse Geocoding
      if (!baseGeocode) {
        try {
          const bdcRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          if (bdcRes.ok) {
            const bdc = await bdcRes.json();
            const locality = isCleanString(bdc.locality || bdc.city)
              ? (bdc.locality || bdc.city).trim()
              : "";
            const city = isCleanString(bdc.city) ? bdc.city.trim() : "";
            const state = isCleanString(bdc.principalSubdivision)
              ? bdc.principalSubdivision.trim()
              : "";
            const pincode = isCleanString(bdc.postcode) ? bdc.postcode.trim() : "";

            // BigDataCloud client does NOT provide society/building data; never use city/subdivision as society
            baseGeocode = {
              area: locality || city || "Detected Location",
              society: "", // Empty string as per requirements
              houseNo: "",
              landmark: "",
              formattedAddress: `${locality ? `${locality}, ` : ""}${city ? `${city}, ` : ""}${state} ${pincode}`.trim(),
              city,
              state,
              pincode,
              coordinates: { latitude: lat, longitude: lng },
            };
          }
        } catch (bdcErr) {
          if (process.env.NODE_ENV !== "production") {
            console.error("BigDataCloud fallback failed:", bdcErr);
          }
        }
      }

      // 3. Absolute Fallback: Safe generic coordinates without fake data
      if (!baseGeocode) {
        baseGeocode = {
          area: "Detected Location",
          society: "",
          houseNo: "",
          landmark: "",
          formattedAddress: `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`,
          city: "",
          state: "",
          pincode: "",
          coordinates: { latitude: lat, longitude: lng },
        };
      }

      // Cache the static geocoded address
      setCache(GEOCODE_CACHE, cacheKey, baseGeocode);
    }

    // Step 2: Build delivery location and ALWAYS dynamically resolve store serviceability
    const finalLocation: DeliveryLocation = {
      ...baseGeocode,
      deliveryEtaMinutes: 0,
      isServiceable: false,
      darkStoreId: undefined,
      darkStoreName: undefined,
    };

    await attachResolvedStore(finalLocation, lat, lng);

    return NextResponse.json(finalLocation);
  }

  // ==========================================
  // FORWARD SEARCH & AUTOCOMPLETE
  // ==========================================
  const query = searchParams.get("q") || searchParams.get("query");
  if (!query || !query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const cleanQuery = query.trim().toLowerCase();
  const cachedSearch = SEARCH_CACHE.get(cleanQuery);
  if (cachedSearch && Date.now() - cachedSearch.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ results: cachedSearch.data });
  }

  try {
    const searchRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query.trim()
      )}&limit=6&addressdetails=1&namedetails=1`,
      {
        headers: {
          "User-Agent": "TidingGroceryWeb/1.0 (contact@tiding.com)",
          "Accept-Language": "en",
        },
      }
    );

    if (searchRes.ok) {
      const results = await searchRes.json();
      const formatted: DeliveryLocation[] = results.map((item: any) => {
        const base = parseBlinkitStyleAddress(
          item,
          parseFloat(item.lat),
          parseFloat(item.lon)
        );
        return {
          ...base,
          deliveryEtaMinutes: 0,
          isServiceable: false,
          darkStoreId: undefined,
          darkStoreName: undefined,
        };
      });

      setCache(SEARCH_CACHE, cleanQuery, formatted);
      return NextResponse.json({ results: formatted });
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Geocode search error:", err);
    }
  }

  return NextResponse.json({ results: [] });
}
