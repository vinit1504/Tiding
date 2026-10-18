import { SavedAddress } from "./location";

export interface BackendUserProfile {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  timezone?: string | null;
  locale?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  roles?: string[];
  status?: string;
  walletBalance: number;
  savedAddresses: SavedAddress[];
  profile?: BackendUserProfile;
}

export interface AuthSession {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
}
