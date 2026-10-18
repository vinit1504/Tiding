/**
 * Token Storage Manager for Web Session & Authentication
 * Provides safe SSR-aware localStorage persistence
 */

export const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: "tiding_token",
  REFRESH_TOKEN: "tiding_refresh_token",
  USER_PROFILE: "tiding_user",
} as const;

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export function setStoredTokens(tokens: { accessToken?: string; refreshToken?: string }): void {
  if (typeof window === "undefined") return;
  try {
    if (tokens.accessToken) {
      localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    }
    if (tokens.refreshToken) {
      localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }
  } catch {
    // Quota exceeded or disabled
  }
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_PROFILE);
  } catch {
    // Ignore error
  }
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(TOKEN_STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredUser<T>(user: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
  } catch {
    // Ignore error
  }
}
