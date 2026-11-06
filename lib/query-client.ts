"use client";

import { QueryClient } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Returns a singleton QueryClient instance in the browser,
 * or a fresh QueryClient per SSR request.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a fresh QueryClient
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 2, // 2 minutes default
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });
  }

  // Browser: maintain a single client instance
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 2,
          refetchOnWindowFocus: false,
          retry: 1,
        },
        mutations: {
          retry: 0,
          onError: (err) => {
            console.warn("[Mutation notice]:", (err as any)?.message || err);
          },
        },
      },
    });
  }

  return browserQueryClient;
}
