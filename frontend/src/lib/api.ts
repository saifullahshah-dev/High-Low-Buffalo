import axios from 'axios';
import { Reflection, ReflectionCreate, ReflectionUpdate, User, UserSettings, Friend, Herd, HerdUpdate } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://high-low-buffalo-backend.onrender.com/api/v1'
    : 'http://localhost:8000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const getReflections = async (): Promise<Reflection[]> => {
  const response = await api.get<Reflection[]>('/reflections/');
  return response.data;
};

export const createReflection = async (data: ReflectionCreate): Promise<Reflection> => {
  const response = await api.post<Reflection>('/reflections/', data);
  return response.data;
};

export const updateReflection = async (id: string, data: ReflectionUpdate): Promise<Reflection> => {
  const response = await api.put<Reflection>(`/reflections/${id}`, data);
  return response.data;
};

export const deleteReflection = async (id: string): Promise<void> => {
  await api.delete(`/reflections/${id}`);
};

export const getUser = async (): Promise<User> => {
  const response = await api.get<User>('/users/me');
  return response.data;
};

export const updateUserSettings = async (settings: UserSettings): Promise<User> => {
  const response = await api.put<User>('/users/me/settings', settings);
  return response.data;
};

export const addFriend = async (email: string): Promise<void> => {
  await api.post('/users/friends', { email });
};

export const deleteFriend = async (friendId: string): Promise<void> => {
  await api.delete(`/users/friends/${friendId}`);
};

export const getFriends = async (): Promise<Friend[]> => {
  const response = await api.get<Friend[]>('/users/friends');
  return response.data;
};

export const getFeed = async (): Promise<Reflection[]> => {
  const response = await api.get<Reflection[]>('/reflections/feed');
  return response.data;
};

export const reactToReflection = async (id: string, type: string): Promise<Reflection> => {
  const response = await api.post<Reflection>(`/reflections/${id}/react`, { type });
  return response.data;
};

export const flagReflection = async (id: string): Promise<Reflection> => {
  const response = await api.post<Reflection>(`/reflections/${id}/flag`);
  return response.data;
};

export const getNotificationStatus = async (): Promise<{ reminder_needed: boolean; message: string }> => {
  const response = await api.get('/notifications/status');
  return response.data;
};

// Herds API

export const getHerds = async (): Promise<Herd[]> => {
  const response = await api.get<Herd[]>('/herds/');
  return response.data;
};

export const createHerd = async (name: string, description?: string): Promise<Herd> => {
  const response = await api.post<Herd>('/herds/', { name, description });
  return response.data;
};

export const getHerd = async (id: string): Promise<Herd> => {
  const response = await api.get<Herd>(`/herds/${id}`);
  return response.data;
};

export const updateHerd = async (id: string, data: HerdUpdate): Promise<Herd> => {
  const response = await api.put<Herd>(`/herds/${id}`, data);
  return response.data;
};

export const deleteHerd = async (id: string): Promise<void> => {
  await api.delete(`/herds/${id}`);
  return;
};

export const addHerdMember = async (id: string, email: string): Promise<void> => {
  await api.post(`/herds/${id}/members`, { email });
};

export const removeHerdMember = async (id: string, userId: string): Promise<void> => {
  await api.delete(`/herds/${id}/members/${userId}`);
};

export const leaveHerd = async (id: string): Promise<void> => {
  // If the backend doesn't have a specific leave endpoint, usually removing self from members works.
  // Assuming backend supports leaving or removing self.
  // Based on common patterns: DELETE /herds/{id}/members/me or similar.
  // The plan said: removeHerdMember(id: string, userId: string): DELETE `/herds/{id}/members/{userId}`
  // So we can use that if we know our own ID, or if the backend supports 'me'.
  // I'll assume we need to fetch user ID first or the UI handles it.
  // Actually, checking the plan: "If Member: Allow leaving herd."
  // I'll add a specific wrapper if needed, but removeHerdMember should suffice if we have the user's ID.
  // Let's stick to the plan's list for now.
  // Wait, I missed "leaveHerd" in the plan explicitly, but "Allow leaving herd" implies functionality.
  // I will check if I can just use removeHerdMember with the current user's ID.
};