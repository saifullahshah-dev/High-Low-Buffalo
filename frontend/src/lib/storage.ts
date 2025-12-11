import { Reflection, UserSettings } from "@/types";

const STORAGE_KEYS = {
  REFLECTIONS: 'hlb_reflections',
  USER_SETTINGS: 'hlb_user_settings',
};

export const getReflections = (): Reflection[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load reflections from localStorage", error);
    return [];
  }
};

export const saveReflections = (reflections: Reflection[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflections));
  } catch (error) {
    console.error("Failed to save reflections to localStorage", error);
  }
};

export const getUserSettings = (): UserSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
    // Default settings
    return {
      notificationCadence: 'daily',
      herds: [{ id: 'self', name: 'Just Me', members: [] }], // Default 'Just Me' herd
      friends: [],
    };
  } catch (error) {
    console.error("Failed to load user settings from localStorage", error);
    return {
      notificationCadence: 'daily',
      herds: [{ id: 'self', name: 'Just Me', members: [] }],
      friends: [],
    };
  }
};

export const saveUserSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save user settings to localStorage", error);
  }
};