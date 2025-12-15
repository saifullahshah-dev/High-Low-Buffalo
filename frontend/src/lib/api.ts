import axios from 'axios';
import { Reflection, ReflectionCreate, ReflectionUpdate, User, UserSettings } from '@/types';

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