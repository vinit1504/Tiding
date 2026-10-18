import { SITE_CONFIG } from "@/lib/constants/site-config";

export interface RequestOptions<T = unknown> {
  headers?: Record<string, string>;
  fallbackData?: T;
  cache?: RequestCache;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = SITE_CONFIG.apiUrl;
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("tiding_token");
        if (token) {
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
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          ...this.getDefaultHeaders(),
          ...(options.headers || {}),
        },
        cache: options.cache || "no-store",
      });

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
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          ...this.getDefaultHeaders(),
          ...(options.headers || {}),
        },
        cache: options.cache || "no-store",
      });

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
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          ...this.getDefaultHeaders(),
          ...(options.headers || {}),
        },
        body: JSON.stringify(body),
      });

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
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        headers: {
          ...this.getDefaultHeaders(),
          ...(options?.headers || {}),
        },
        body: JSON.stringify(body),
      });

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
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: {
          ...this.getDefaultHeaders(),
          ...(options?.headers || {}),
        },
      });

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
