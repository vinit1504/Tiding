import { atom } from "jotai";
import { UserProfile } from "@/types/user";

export const userProfileAtom = atom<UserProfile | null>(null);
