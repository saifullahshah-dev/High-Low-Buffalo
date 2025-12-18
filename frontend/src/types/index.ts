export type ReflectionType = 'high' | 'low' | 'buffalo';

export interface Reflection {
  id: string;
  high: string;
  low: string;
  buffalo: string;
  timestamp: string; // ISO date string
  sharedWith: string[]; // IDs of herds/friends
  image?: string; // Base64 string of the image
  curiosityReactions: Record<string, string[]>; // Mapping reaction type to list of user IDs
  isFlaggedForFollowUp?: boolean; // New: Flag to remind user to ask for more detail
  user_id?: string;
  author_name?: string;
}

export interface ReflectionCreate {
  high: string;
  low: string;
  buffalo: string;
  image?: string;
  sharedWith: string[];
}

export interface ReflectionUpdate {
  high?: string;
  low?: string;
  buffalo?: string;
  image?: string;
  sharedWith?: string[];
  curiosityReactions?: Record<string, string[]>;
  isFlaggedForFollowUp?: boolean;
}

export interface HerdMember {
  user_id: string;
  email: string;
  full_name?: string;
  joined_at: string;
  role: string; // 'owner' | 'member'
}

export interface Herd {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  members: HerdMember[];
}

export interface HerdUpdate {
  name?: string;
  description?: string;
}

export interface UserSettings {
  notificationCadence: 'daily' | 'weekly' | 'paused';
  // Herds are now managed via separate API calls, but we might keep a reference here if needed,
  // or remove it if the backend User object doesn't return it anymore.
  // For now, let's keep it compatible but marked optional or handled separately.
  // In the new design, herds are fetched via /herds/, not embedded in settings.
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  settings?: UserSettings;
}

export interface Friend {
  id: string;
  email: string;
  full_name: string;
}