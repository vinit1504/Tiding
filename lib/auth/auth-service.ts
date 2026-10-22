import { SITE_CONFIG } from "@/lib/constants/site-config";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import { UserProfile, DeviceSessionDto, UpdateProfileDto } from "@/types/user";
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
   * 1. Register with Email/Password
   */
  async register(payload: {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Registration failed");
    }
    return json;
  }

  /**
   * 2. Login with Email/Password
   */
  async login(payload: {
    email: string;
    password?: string;
    deviceName?: string;
    deviceType?: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: UserProfile }> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        deviceName: payload.deviceName || "Web Browser",
        deviceType: payload.deviceType || "DESKTOP",
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || "Invalid credentials");
    }
    const data = json.data;
    this.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    const userProfile = parseBackendUserToProfile(data.user, payload.email);
    setStoredUser(userProfile);
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: userProfile,
    };
  }

  /**
   * 3. Send 6-digit Email OTP
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
   * 4. Verify Email OTP
   */
  async verifyEmailOtp(
    email: string,
    otp: string
  ): Promise<{ accessToken: string; refreshToken: string; user: UserProfile }> {
    const cleanEmail = email.trim().toLowerCase();
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN_EMAIL_OTP_VERIFY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
   * Unified Send OTP (Email or Phone)
   */
  async sendOtp(contact: string): Promise<{ success: boolean; message?: string }> {
    if (contact.includes("@")) {
      return this.sendEmailOtp(contact);
    }
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN_SMS_OTP_SEND}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: contact.trim() }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to send SMS OTP");
    }
    return json;
  }

  /**
   * Unified Verify OTP
   */
  async verifyOtp(contact: string, otp: string) {
    if (contact.includes("@")) {
      return this.verifyEmailOtp(contact, otp);
    }
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN_SMS_OTP_VERIFY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        phone: contact.trim(),
        otp: otp.trim(),
        deviceName: "Web Browser",
        deviceType: "DESKTOP",
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || "Invalid OTP code");
    }
    const data = json.data;
    this.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    const userProfile = parseBackendUserToProfile(data.user, contact);
    setStoredUser(userProfile);
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: userProfile,
    };
  }

  /**
   * 5. Refresh Access Token (Cookie or Header)
   */
  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string } | null> {
    const token = this.getRefreshToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["x-refresh-token"] = token;
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
        method: "POST",
        headers,
        credentials: "include", // Ensures httpOnly refresh cookie is sent
        body: JSON.stringify(
          token ? { refreshToken: token, refresh_token: token } : {}
        ),
      });

      const json = await res.json().catch(() => null);
      const data = json?.data || json;
      const accessToken =
        data?.accessToken || data?.access_token || data?.token;
      const newRefreshToken =
        data?.refreshToken || data?.refresh_token || token || undefined;

      if (res.ok && accessToken) {
        this.setTokens({
          accessToken,
          ...(newRefreshToken ? { refreshToken: newRefreshToken } : {}),
        });
        return {
          accessToken,
          refreshToken: newRefreshToken || "",
        };
      }
      return null;
    } catch (err) {
      console.warn("Failed to refresh token:", err);
      return null;
    }
  }

  /**
   * 6. Logout Current User
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
          credentials: "include",
        });
      } catch (err) {
        console.warn("Server logout call failed:", err);
      }
    }
    this.clearAuth();
  }

  /**
   * 7. Forgot Password
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to process forgot password request");
    }
    return json;
  }

  /**
   * 8. Reset Password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to reset password");
    }
    return json;
  }

  /**
   * 9. Get Current Authenticated User (Me)
   */
  async getMe(): Promise<UserProfile | null> {
    const token = this.getAccessToken();
    if (!token) return null;

    if (token === "token_vinit_default" || !token.includes(".")) {
      return null;
    }

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
   * 10. Update Profile (PUT /api/v1/auth/me)
   */
  async updateProfile(payload: UpdateProfileDto): Promise<UserProfile> {
    const token = this.getAccessToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.ME}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || "Failed to update profile");
    }

    const updatedUser = json.data;
    const fallback = updatedUser.email || updatedUser.phone || "User";
    const profile = parseBackendUserToProfile(updatedUser, fallback);
    setStoredUser(profile);
    return profile;
  }

  /**
   * 11. List Active Device Sessions (GET /api/v1/auth/sessions)
   */
  async listSessions(): Promise<DeviceSessionDto[]> {
    const token = this.getAccessToken();
    if (!token) return [];

    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.SESSIONS}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return [];
    }

    return Array.isArray(json.data) ? json.data : [];
  }

  /**
   * 12. Revoke Specific Session (DELETE /api/v1/auth/sessions/:sessionId)
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; message?: string }> {
    const token = this.getAccessToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.SESSION(sessionId)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to revoke session");
    }
    return json;
  }

  /**
   * 13. Revoke All Other Sessions (POST /api/v1/auth/logout-all)
   */
  async logoutAllSessions(): Promise<{ success: boolean; message?: string }> {
    const token = this.getAccessToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGOUT_ALL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to logout all sessions");
    }
    return json;
  }
}

export const authService = new AuthService();
