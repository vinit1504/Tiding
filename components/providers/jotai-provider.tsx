"use client";

import React from "react";
import { Provider as JotaiProvider, getDefaultStore } from "jotai";

export function JotaiClientProvider({ children }: { children: React.ReactNode }) {
  return <JotaiProvider store={getDefaultStore()}>{children}</JotaiProvider>;
}
