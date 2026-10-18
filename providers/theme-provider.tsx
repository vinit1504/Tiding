"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";

export interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
  themes: string[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  resolvedTheme: "light",
  themes: ["light"],
});

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
      try {
        localStorage.removeItem("tiding_theme");
        localStorage.setItem("tiding_theme", "light");
      } catch {}
    }
  }, []);

  const value = useMemo(
    () => ({
      theme: "light",
      setTheme: () => {},
      resolvedTheme: "light",
      themes: ["light"],
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
