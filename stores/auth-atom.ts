import { atom } from "jotai";
import { UserProfile, AuthSession } from "@/types/user";

export const authUserAtom = atom<UserProfile | null>(null);

export const authSessionAtom = atom<AuthSession>({
  user: null,
  token: null,
  isAuthenticated: false,
});

export const isAuthLoadingAtom = atom<boolean>(false);
