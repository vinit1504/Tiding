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
      const isLoggedOut = localStorage.getItem("tiding_logged_out") === "true";
      const savedUser = localStorage.getItem("tiding_user");
      const savedToken = localStorage.getItem("tiding_token");
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
              }
            });
          });
        }
      } else if (!isLoggedOut) {
        const defaultUser = {
          id: "usr-vinit",
          name: "Vinit",
          firstName: "Vinit",
          email: "vinit@example.com",
          phone: "+91 75673 37686",
          walletBalance: 100,
          roles: ["CUSTOMER"],
          status: "ACTIVE",
          savedAddresses: [],
        };
        setUser(defaultUser);
        setSession({
          user: defaultUser,
          token: "token_vinit_default",
          isAuthenticated: true,
        });
        localStorage.setItem("tiding_user", JSON.stringify(defaultUser));
        localStorage.setItem("tiding_token", "token_vinit_default");
      }
    } catch {}
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
