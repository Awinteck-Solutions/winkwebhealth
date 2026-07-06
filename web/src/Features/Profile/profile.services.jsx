import apiClient from '../../utils/apiClient';
import { profileEndpoints } from './profile.endpoints';

export const profileApi = {
  update: (data) => apiClient.patch(profileEndpoints.UPDATE, data),
  changePassword: (data) => apiClient.patch(profileEndpoints.CHANGE_PASSWORD, data),
};
