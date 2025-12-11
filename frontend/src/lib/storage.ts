import { Reflection, UserSettings, User } from "@/types";
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  REFLECTIONS: 'hlb_reflections',
  USER_SETTINGS: 'hlb_user_settings',
  AUTH_TOKEN: 'hlb_auth_token', // New: for mock auth token
  CURRENT_USER: 'hlb_current_user', // New: for mock current user
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

export const updateReflection = (updatedReflection: Reflection): void => {
  try {
    const reflections = getReflections();
    const index = reflections.findIndex(r => r.id === updatedReflection.id);
    if (index !== -1) {
      reflections[index] = updatedReflection;
      saveReflections(reflections);
    }
  } catch (error) {
    console.error("Failed to update reflection in localStorage", error);
  }
};

export const deleteReflection = (reflectionId: string): void => {
  try {
    let reflections = getReflections();
    reflections = reflections.filter(r => r.id !== reflectionId);
    saveReflections(reflections);
  } catch (error) {
    console.error("Failed to delete reflection from localStorage", error);
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

// --- Mock Authentication Functions ---

export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return userData ? JSON.parse(userData) : null;
};

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      if (email === "test@example.com" && password === "password") {
        const mockUser: User = { id: uuidv4(), email, name: "Test User" };
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "mock_jwt_token");
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockUser));
        resolve({ success: true, message: "Login successful!", user: mockUser });
      } else {
        resolve({ success: false, message: "Invalid email or password." });
      }
    }, 500);
  });
};

export const registerUser = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real app, you'd check if email already exists
      const mockUser: User = { id: uuidv4(), email, name: "New User" };
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, "mock_jwt_token_new");
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockUser));
      resolve({ success: true, message: "Registration successful!", user: mockUser });
    }, 500);
  });
};

export const logoutUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};