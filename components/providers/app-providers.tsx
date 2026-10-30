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
  deduplicateCartItems,
} from "@/stores";
import { TanStackQueryProvider } from "./query-client-provider";
import { ThemeProvider } from "./theme-provider";
import { JotaiClientProvider } from "./jotai-provider";
import { Toaster } from "sonner";
import { useMyCartQuery } from "@/queries/cart/use-cart-mutations";
import { useMeQuery } from "@/queries/auth/use-me-query";

function CartServerSync() {
  useMyCartQuery();
  return null;
}

function AuthServerSync() {
  useMeQuery();
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
        const parsed = JSON.parse(savedCart);
        const deduped = deduplicateCartItems(parsed);
        setCartItems(deduped);
        if (Array.isArray(parsed) && deduped.length !== parsed.length) {
          localStorage.setItem("tiding_cart", JSON.stringify(deduped));
        }
      }
    } catch {}

    try {
      const savedLater = localStorage.getItem("tiding_cart_saved_for_later");
      if (savedLater) {
        const parsed = JSON.parse(savedLater);
        const deduped = deduplicateCartItems(parsed);
        setSavedForLater(deduped);
        if (Array.isArray(parsed) && deduped.length !== parsed.length) {
          localStorage.setItem("tiding_cart_saved_for_later", JSON.stringify(deduped));
        }
      }
    } catch {}

    try {
      const savedUser = localStorage.getItem("tiding_user");
      const savedToken = localStorage.getItem("tiding_token");

      if (savedToken && savedToken !== "token_vinit_default") {
        let parsedUser: any = null;
        try {
          if (savedUser) parsedUser = JSON.parse(savedUser);
        } catch {}

        if (parsedUser) {
          setUser(parsedUser);
          setSession({
            user: parsedUser,
            token: savedToken,
            isAuthenticated: true,
          });
        } else {
          // Token exists in storage: authenticate immediately so UI reflects signed-in state!
          setSession({
            user: null,
            token: savedToken,
            isAuthenticated: true,
          });
        }

        // Sync live profile from /auth/me when token is present
        if (!hasSyncedAuthRef.current) {
          hasSyncedAuthRef.current = true;
          import("@/lib/auth/auth-service").then(({ authService }) => {
            authService.getMe().then((liveProfile) => {
              if (liveProfile) {
                setUser(liveProfile);
                setSession({
                  user: liveProfile,
                  token: savedToken,
                  isAuthenticated: true,
                });
                try {
                  localStorage.setItem("tiding_user", JSON.stringify(liveProfile));
                } catch {}
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
          <AuthServerSync />
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
