export type ReflectionType = 'high' | 'low' | 'buffalo';

export interface Reflection {
  id: string;
  high: string;
  low: string;
  buffalo: string;
  timestamp: string; // ISO date string
  sharedWith: string[]; // IDs of herds/friends
  curiosityReactions: { [reflectionId: string]: number }; // Count of curiosity reactions
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