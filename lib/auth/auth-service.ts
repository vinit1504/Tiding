import { SITE_CONFIG } from "@/lib/constants/site-config";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import { UserProfile } from "@/types/user";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredAuth,
  setStoredUser,
} from "./token-storage";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface BackendUserResponse {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  roles?: string[];
  status?: string;
  walletBalance?: number;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    avatarPublicId?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    timezone?: string | null;
    locale?: string | null;
  };
  addresses?: Array<{
    id?: string;
    addressType?: string;
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    areaName?: string;
    cityName?: string;
    pincode?: string;
    isDefault?: boolean;
  }>;
}

export function parseBackendUserToProfile(
  backendUser: BackendUserResponse | null | undefined,
  fallbackContact: string
): UserProfile {
  const profile = backendUser?.profile || {};
  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";
  const displayName = profile.displayName || (firstName ? `${firstName} ${lastName}`.trim() : "");
  const name = displayName || backendUser?.name || fallbackContact.split("@")[0] || "Valued Customer";

  const savedAddresses = (backendUser?.addresses || []).map((addr) => ({
    id: addr.id || `addr-${Date.now()}`,
    type: ((addr.addressType?.toLowerCase() === "office" || addr.addressType?.toLowerCase() === "work") ? "work" : "home") as "work" | "home" | "other",
    title: addr.addressType || "Home",
    addressLine: [addr.addressLine1, addr.addressLine2, addr.landmark].filter(Boolean).join(", "),
    area: addr.areaName || "",
    city: addr.cityName || "",
    pincode: addr.pincode || "",
    isDefault: !!addr.isDefault,
  }));

  return {
    id: backendUser?.id || `usr-${Date.now()}`,
    name,
    firstName: firstName || name.split(" ")[0],
    lastName: lastName || "",
    email: backendUser?.email || (fallbackContact.includes("@") ? fallbackContact : undefined),
    phone: backendUser?.phone || (!fallbackContact.includes("@") ? fallbackContact : undefined),
    avatar_url: profile.avatarUrl || undefined,
    roles: backendUser?.roles || ["CUSTOMER"],
    status: backendUser?.status || "ACTIVE",
    walletBalance: backendUser?.walletBalance ?? 100,
    savedAddresses,
    profile,
  };
}

export class AuthService {
  private baseUrl: string;
  private inFlightMePromise: Promise<UserProfile | null> | null = null;

  constructor() {
    this.baseUrl = SITE_CONFIG.apiUrl;
  }

  getAccessToken(): string | null {
    return getStoredAccessToken();
  }

  getRefreshToken(): string | null {
    return getStoredRefreshToken();
  }

  setTokens(tokens: { accessToken?: string; refreshToken?: string }): void {
    setStoredTokens(tokens);
  }

  clearAuth(): void {
    clearStoredAuth();
  }

  /**
   * Send 6-digit Email OTP
   */
  async sendEmailOtp(email: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN_EMAIL_OTP_SEND}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to send verification email code");
    }
    return json;
  }

  /**
   * Verify Email OTP
   */
  async verifyEmailOtp(
    email: string,
    otp: string
  ): Promise<{ accessToken: string; refreshToken: string; user: UserProfile }> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN_EMAIL_OTP_VERIFY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        otp: otp.trim(),
        deviceName: "Web Browser",
        deviceType: "DESKTOP",
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || "Invalid or expired verification code");
    }

    const data = json.data;
    this.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    const userProfile = parseBackendUserToProfile(data.user, cleanEmail);
    setStoredUser(userProfile);

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: userProfile,
    };
  }

  /**
   * Refresh Access Token
   */
  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
    const token = this.getRefreshToken();
    if (!token) return null;

    try {
      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token }),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json?.data?.accessToken) {
        this.setTokens({
          accessToken: json.data.accessToken,
          refreshToken: json.data.refreshToken || token,
        });
        return {
          accessToken: json.data.accessToken,
          refreshToken: json.data.refreshToken || token,
        };
      }
      return null;
    } catch (err) {
      console.warn("Failed to refresh token:", err);
      return null;
    }
  }

  /**
   * Get Current Authenticated User (Me)
   * Deduplicates concurrent in-flight requests to avoid redundant duplicate calls
   */
  async getMe(): Promise<UserProfile | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    // Do not attempt backend verification with default mock token
    if (token === "token_vinit_default" || !token.includes(".")) {
      return null;
    }

    // If a getMe request is already in-flight, return the same promise
    if (this.inFlightMePromise) {
      return this.inFlightMePromise;
    }

    this.inFlightMePromise = (async () => {
      try {
        let activeToken = token;
        let res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.ME}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeToken}`,
          },
        });

        // If token expired (401), attempt refresh once
        if (res.status === 401) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed?.accessToken) {
            activeToken = refreshed.accessToken;
            res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.ME}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${activeToken}`,
              },
            });
          } else {
            this.clearAuth();
            return null;
          }
        }

        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && json?.data) {
          const rawUser = json.data;
          const fallbackContact = rawUser.email || rawUser.phone || "User";
          const profile = parseBackendUserToProfile(rawUser, fallbackContact);
          setStoredUser(profile);
          return profile;
        }
        return null;
      } catch (err) {
        console.warn("getMe network error:", err);
        return null;
      } finally {
        this.inFlightMePromise = null;
      }
    })();

    return this.inFlightMePromise;
  }

  /**
   * Logout Current User
   */
  async logout(): Promise<void> {
    const token = this.getAccessToken();
    if (token) {
      try {
        await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn("Server logout call failed:", err);
      }
    }
    this.clearAuth();
  }
}

export const authService = new AuthService();
