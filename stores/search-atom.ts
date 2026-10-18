import { atom } from "jotai";

export const globalSearchQueryAtom = atom<string>("");
export const searchFilterAtom = atom<{
  category?: string;
  sortBy?: "popularity" | "price_asc" | "price_desc" | "rating";
}>({});
