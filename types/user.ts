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

export interface DeviceSessionDto {
  id: string;
  userId: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt?: string;
  createdAt?: string;
  isCurrentSession?: boolean;
}

export interface UpdateProfileDto {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  avatar_url?: string;
  avatar_public_id?: string;
  date_of_birth?: string;
  gender?: string;
  timezone?: string;
  locale?: string;
}
