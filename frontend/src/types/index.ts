export type ReflectionType = 'high' | 'low' | 'buffalo';

export interface Reflection {
  id: string;
  high: string;
  low: string;
  buffalo: string;
  timestamp: string; // ISO date string
  sharedWith: string[]; // IDs of herds/friends
  curiosityReactions: { [reflectionId: string]: number }; // Count of curiosity reactions
  isFlaggedForFollowUp?: boolean; // New: Flag to remind user to ask for more detail
  user_id?: string;
}

export interface ReflectionCreate {
  high: string;
  low: string;
  buffalo: string;
  sharedWith: string[];
}

export interface ReflectionUpdate {
  high?: string;
  low?: string;
  buffalo?: string;
  sharedWith?: string[];
  curiosityReactions?: { [reflectionId: string]: number };
  isFlaggedForFollowUp?: boolean;
}

export interface Herd {
  id: string;
  name: string;
  members: string[]; // User IDs (for a real app, here just names/identifiers)
}

export interface UserSettings {
  notificationCadence: 'daily' | 'weekly' | 'paused';
  herds: Herd[];
  friends: string[]; // Simple list of friend names/identifiers
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  settings?: UserSettings;
}