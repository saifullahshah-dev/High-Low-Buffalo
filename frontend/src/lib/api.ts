import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://high-low-buffalo-proj-be.onrender.com/api/v1'
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