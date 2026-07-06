import apiClient from '../../utils/apiClient';
import { alertChannelEndpoints } from './alerts.endpoints';

export const alertsApi = {
  list: () => apiClient.get(alertChannelEndpoints.LIST),
  create: (data) => apiClient.post(alertChannelEndpoints.CREATE, data),
  update: (id, data) => apiClient.patch(alertChannelEndpoints.ONE(id), data),
  remove: (id) => apiClient.delete(alertChannelEndpoints.ONE(id)),
  test: (id) => apiClient.post(alertChannelEndpoints.TEST(id)),
};
