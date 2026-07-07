import axios from 'axios';
import { BASEURL } from '../constants/api.constant';
import { getAuthToken, logout } from './auth';

/** Admin API — no X-Workspace-Id header (cross-tenant). */
const adminApiClient = axios.create({ baseURL: BASEURL });

adminApiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApiClient;
