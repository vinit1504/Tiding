"use client";

import React, { useEffect } from "react";
import { useAtom } from "jotai";
import {
  deliveryLocationAtom,
  hasUserSetLocationAtom,
  cartItemsAtom,
  savedForLaterItemsAtom,
  userProfileAtom,
  authSessionAtom,
} from "@/stores";
import { TanStackQueryProvider } from "./query-client-provider";
import { ThemeProvider } from "./theme-provider";
import { JotaiClientProvider } from "./jotai-provider";
import { Toaster } from "sonner";
import { useMyCartQuery } from "@/queries/cart/use-cart-mutations";

function CartServerSync() {
  useMyCartQuery();
  return null;
}

function StoreHydrator() {
  const [, setLocation] = useAtom(deliveryLocationAtom);
  const [, setHasSetLocation] = useAtom(hasUserSetLocationAtom);
  const [, setCartItems] = useAtom(cartItemsAtom);
  const [, setSavedForLater] = useAtom(savedForLaterItemsAtom);
  const [, setUser] = useAtom(userProfileAtom);
  const [, setSession] = useAtom(authSessionAtom);
  const hasSyncedAuthRef = React.useRef(false);

  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem("tiding_delivery_location");
      if (savedLocation) {
        setLocation(JSON.parse(savedLocation));
        setHasSetLocation(true);
      }
    } catch {}

    try {
      const savedCart = localStorage.getItem("tiding_cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch {}

    try {
      const savedLater = localStorage.getItem("tiding_cart_saved_for_later");
      if (savedLater) {
        setSavedForLater(JSON.parse(savedLater));
      }
    } catch {}

    try {
      const savedUser = localStorage.getItem("tiding_user");
      const savedToken = localStorage.getItem("tiding_token");

      // Clear legacy mock tokens if found
      if (savedToken === "token_vinit_default" || savedUser?.includes("usr-vinit")) {
        localStorage.removeItem("tiding_user");
        localStorage.removeItem("tiding_token");
        setUser(null);
        setSession({ user: null, token: null, isAuthenticated: false });
        return;
      }

      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setSession({
          user: parsedUser,
          token: savedToken,
          isAuthenticated: true,
        });

        // Sync with backend /auth/me in background once per session load
        if (!hasSyncedAuthRef.current) {
          hasSyncedAuthRef.current = true;
          import("@/lib/auth/auth-service").then(({ authService }) => {
            authService.getMe().then((liveProfile) => {
              if (liveProfile) {
                setUser(liveProfile);
                setSession((prev) => ({
                  ...prev,
                  user: liveProfile,
                  isAuthenticated: true,
                }));
              } else {
                // If token rejected/expired and refresh failed, clear session
                setUser(null);
                setSession({ user: null, token: null, isAuthenticated: false });
                authService.clearAuth();
              }
            });
          });
        }
      } else {
        // User is unauthenticated: ensure clean null state
        setUser(null);
        setSession({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      }
    } catch {}

    const handleAuthExpired = () => {
      setUser(null);
      setSession({
        user: null,
        token: null,
        isAuthenticated: false,
      });
      try {
        localStorage.removeItem("tiding_user");
        localStorage.removeItem("tiding_token");
        localStorage.removeItem("tiding_refresh_token");
      } catch {}
    };

    window.addEventListener("tiding_auth_expired", handleAuthExpired);
    return () => {
      window.removeEventListener("tiding_auth_expired", handleAuthExpired);
    };
  }, [setLocation, setHasSetLocation, setCartItems, setSavedForLater, setUser, setSession]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <JotaiClientProvider>
        <StoreHydrator />
        <TanStackQueryProvider>
          <CartServerSync />
          {children}
          <Toaster
            position="top-right"
            richColors
            style={{
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
            }}
            toastOptions={{
              style: {
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                borderRadius: "0.85rem",
              },
              className: "font-sans",
            }}
          />
        </TanStackQueryProvider>
      </JotaiClientProvider>
    </ThemeProvider>
  );
}
