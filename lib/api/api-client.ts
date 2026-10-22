import { SITE_CONFIG } from "@/lib/constants/site-config";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

export interface RequestOptions<T = unknown> {
  headers?: Record<string, string>;
  fallbackData?: T;
  cache?: RequestCache;
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseUrl = SITE_CONFIG.apiUrl;
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      try {
        const token = getStoredAccessToken();
        if (token && token !== "token_vinit_default") {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const storedLocation = localStorage.getItem("tiding_delivery_location");
        if (storedLocation) {
          const loc = JSON.parse(storedLocation);
          if (loc?.darkStoreId) {
            headers["x-store-id"] = loc.darkStoreId;
          }
          if (loc?.areaId) {
            headers["x-area-id"] = loc.areaId;
          }
        }
      } catch {
        // ignore JSON parse/storage exceptions
      }
    }

    return headers;
  }

  /**
   * Internal request handler that handles Authorization headers,
   * intercepts 401 Unauthorized, runs refresh token, and retries the request.
   */
  private async request(
    endpoint: string,
    init: RequestInit,
    customHeaders?: Record<string, string>,
    isRetry = false
  ): Promise<Response> {
    const defaultHeaders = this.getDefaultHeaders();
    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...(customHeaders || {}),
    };

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...init,
      headers,
      credentials: "include", // Required for cross-origin cookie authentication
    });

    // If 401 Unauthorized, attempt token refresh and retry once
    if (res.status === 401 && !isRetry && !endpoint.startsWith("/auth/")) {
      const newAccessToken = await this.refreshToken();
      if (newAccessToken) {
        // Retry the original request with the new access token
        return this.request(
          endpoint,
          init,
          {
            ...(customHeaders || {}),
            Authorization: `Bearer ${newAccessToken}`,
          },
          true
        );
      }
    }

    return res;
  }

  /**
   * Handles concurrency-safe refresh token exchange.
   * If multiple requests trigger 401 simultaneously, they share this single promise.
   */
  private async refreshToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const { authService } = await import("@/lib/auth/auth-service");
        // Always invoke refreshAccessToken: refresh token can be delivered
        // via httpOnly Cookie or via Header/localStorage.
        const refreshed = await authService.refreshAccessToken();
        if (refreshed?.accessToken) {
          return refreshed.accessToken;
        }

        console.warn("[ApiClient] Refresh token invalid or expired. Session expired.");
        authService.clearAuth();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("tiding_auth_expired"));
        }
        return null;
      } catch (err) {
        console.error("[ApiClient] Token refresh failed:", err);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async extractErrorMessage(res: Response): Promise<string> {
    try {
      const json = await res.json();
      if (json?.error?.details && Array.isArray(json.error.details) && json.error.details.length > 0) {
        const detailsStr = json.error.details.map((d: any) => `${d.field ? d.field + ": " : ""}${d.message}`).join(", ");
        return `${json.error.message || "Validation failed"}: ${detailsStr}`;
      }
      return json?.error?.message || json?.message || `HTTP error! status: ${res.status}`;
    } catch {
      return `HTTP error! status: ${res.status}`;
    }
  }

  async get<T>(endpoint: string, optionsOrFallback?: RequestOptions<T> | T): Promise<T> {
    const isOptionsObj =
      optionsOrFallback !== null &&
      typeof optionsOrFallback === "object" &&
      ("headers" in (optionsOrFallback as object) ||
        "fallbackData" in (optionsOrFallback as object) ||
        "cache" in (optionsOrFallback as object));

    const options: RequestOptions<T> = isOptionsObj
      ? (optionsOrFallback as RequestOptions<T>)
      : { fallbackData: optionsOrFallback as T };

    try {
      const res = await this.request(
        endpoint,
        {
          method: "GET",
          cache: options.cache || "no-store",
        },
        options.headers
      );

      if (!res.ok) {
        const errorMsg = await this.extractErrorMessage(res);
        throw new Error(errorMsg);
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      if (options.fallbackData !== undefined) {
        return options.fallbackData;
      }
      throw err;
    }
  }

  async getWithMeta<T>(
    endpoint: string,
    optionsOrFallback?: RequestOptions<T> | T
  ): Promise<{ data: T; meta?: any }> {
    const isOptionsObj =
      optionsOrFallback !== null &&
      typeof optionsOrFallback === "object" &&
      ("headers" in (optionsOrFallback as object) ||
        "fallbackData" in (optionsOrFallback as object) ||
        "cache" in (optionsOrFallback as object));

    const options: RequestOptions<T> = isOptionsObj
      ? (optionsOrFallback as RequestOptions<T>)
      : { fallbackData: optionsOrFallback as T };

    try {
      const res = await this.request(
        endpoint,
        {
          method: "GET",
          cache: options.cache || "no-store",
        },
        options.headers
      );

      if (!res.ok) {
        const errorMsg = await this.extractErrorMessage(res);
        throw new Error(errorMsg);
      }
      const json = await res.json();
      return {
        data: json.data !== undefined ? json.data : json,
        meta: json.meta,
      };
    } catch (err) {
      if (options.fallbackData !== undefined) {
        return { data: options.fallbackData };
      }
      throw err;
    }
  }

  async post<T, B = unknown>(
    endpoint: string,
    body: B,
    optionsOrFallback?: RequestOptions<T> | T
  ): Promise<T> {
    const isOptionsObj =
      optionsOrFallback !== null &&
      typeof optionsOrFallback === "object" &&
      ("headers" in (optionsOrFallback as object) ||
        "fallbackData" in (optionsOrFallback as object));

    const options: RequestOptions<T> = isOptionsObj
      ? (optionsOrFallback as RequestOptions<T>)
      : { fallbackData: optionsOrFallback as T };

    try {
      const res = await this.request(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        options.headers
      );

      if (!res.ok) {
        const errorMsg = await this.extractErrorMessage(res);
        throw new Error(errorMsg);
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      if (options.fallbackData !== undefined) {
        return options.fallbackData;
      }
      throw err;
    }
  }

  async patch<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: RequestOptions<T>
  ): Promise<T> {
    try {
      const res = await this.request(
        endpoint,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
        options?.headers
      );

      if (!res.ok) {
        const errorMsg = await this.extractErrorMessage(res);
        throw new Error(errorMsg);
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      if (options?.fallbackData !== undefined) {
        return options.fallbackData;
      }
      throw err;
    }
  }

  async delete<T>(endpoint: string, options?: RequestOptions<T>): Promise<T> {
    try {
      const res = await this.request(
        endpoint,
        {
          method: "DELETE",
        },
        options?.headers
      );

      if (!res.ok) {
        const errorMsg = await this.extractErrorMessage(res);
        throw new Error(errorMsg);
      }
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      if (options?.fallbackData !== undefined) {
        return options.fallbackData;
      }
      throw err;
    }
  }
}

export const apiClient = new ApiClient();
