import axios from 'axios';
import { BASEURL } from '../constants/api.constant';
import { getAuthToken, logout, getAuthUser } from './auth';

const apiClient = axios.create({ baseURL: BASEURL });

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const user = getAuthUser();
  if (user?.workspaceOwnerId) {
    config.headers['X-Workspace-Id'] = user.workspaceOwnerId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isInviteAccept = path.startsWith('/invite/');
      if (!isInviteAccept) {
        logout();
        if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
