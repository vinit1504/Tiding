import { atom } from "jotai";

export const isLocationModalOpenAtom = atom<boolean>(false);
export const isCartDrawerOpenAtom = atom<boolean>(false);
export const isAuthDrawerOpenAtom = atom<boolean>(false);
export const isSidebarCollapsedAtom = atom<boolean>(false);
export const selectedCategorySlugAtom = atom<string>("all");
export const liveSearchQueryAtom = atom<string>("");
