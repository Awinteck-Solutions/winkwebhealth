import apiClient from '../../utils/apiClient';
import { monitorEndpoints } from './monitors.endpoints';

export const monitorsApi = {
  list: () => apiClient.get(monitorEndpoints.LIST),
  get: (id) => apiClient.get(monitorEndpoints.ONE(id)),
  create: (data) => apiClient.post(monitorEndpoints.CREATE, data),
  update: (id, data) => apiClient.patch(monitorEndpoints.ONE(id), data),
  remove: (id) => apiClient.delete(monitorEndpoints.ONE(id)),
  checks: (id, days = 7) => apiClient.get(monitorEndpoints.CHECKS(id), { params: { days } }),
  stats: (id) => apiClient.get(monitorEndpoints.STATS(id)),
  testAlerts: (id) => apiClient.post(monitorEndpoints.TEST_ALERTS(id)),
  maintenance: {
    list: (id) => apiClient.get(monitorEndpoints.MAINTENANCE(id)),
    create: (id, data) => apiClient.post(monitorEndpoints.MAINTENANCE(id), data),
    remove: (monitorId, windowId) => apiClient.delete(`${monitorEndpoints.MAINTENANCE(monitorId)}/${windowId}`),
  },
};
